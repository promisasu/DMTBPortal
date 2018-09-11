'use strict';

/**
 * @module controller/server
 */

// load node modules
const authBasic = require('hapi-auth-basic');
const fs = require('fs');
const good = require('good');
const handlebars = require('handlebars');
const hapi = require('hapi');
const inert = require('inert');
const path = require('path');
const vision = require('vision');
const Bcrypt = require('bcrypt');

// load router and database
const router = require('./router');
const database = require('../model');


const users = {
    clinician: {
        username: 'clinician',
        passwordh: '$2b$10$IgvP07TkqN3KfGSCjmrq4.F.gAiRT7x0fcwi6u4Hg.l/80bg2P/ti',   // 'secret'
        name: 'clinician',
        id: '1'
    }
};

const validate = async (request, username, password, h) => {

    if (username === 'help') {
        return { response: h.redirect('https://hapijs.com/help') };     // custom response
    }

    const user = users[username];
    console.log('User object username' + user.name);
    if (!user) {
        return { credentials: null, isValid: false };
    }

    const isValid = await Bcrypt.compare(password, user.passwordh);
    const credentials = { id: user.id, name: user.name };
    console.log(credentials + 'fjsdfdskfnskjdfvkls');

    return { isValid, credentials };
};

exports.dashboardServer = async (configuration) => {
    const connectionOptions = {
        port: configuration.dashboard.port,
        host: configuration.dashboard.hostname,
        routes: {
            security: true
        }
    };

    if (configuration.tls) {
        connectionOptions.tls = {
            key: fs.readFileSync(configuration.tls.key),
            cert: fs.readFileSync(configuration.tls.cert)
        };
        if (configuration.tls.passphrase) {
            connectionOptions.tls.passphrase = configuration.tls.passphrase;
        }
    }

    const server = new hapi.Server(connectionOptions);

   // await server.register(authBasic);
    await server.register(
        [
            {
                plugin: vision
            },
            {
                plugin: inert
            },
            {
                plugin: authBasic
            },
            {
                plugin: good,
                options: {
                    ops: {
                        interval: 60000
                    },
                    reporters: {
                        logs: [
                            {
                                module: 'good-squeeze',
                                name: 'Squeeze',
                                args: [{
                                    error: '*',
                                    log: '*',
                                    request: '*',
                                    response: '*'
                                }]
                            },
                            {
                                module: 'good-squeeze',
                                name: 'SafeJson'
                            },
                            {
                                module: 'good-file',
                                args: [
                                    `./logs/${Date.now()}-prp-${configuration.environment}-dashboard-access.log`
                                ]
                            }
                        ],
                        ops: [
                            {
                                module: 'good-squeeze',
                                name: 'Squeeze',
                                args: [{
                                    ops: '*'
                                }]
                            },
                            {
                                module: 'good-squeeze',
                                name: 'SafeJson'
                            },
                            {
                                module: 'good-file',
                                args: [
                                    `./logs/${Date.now()}-prp-${configuration.environment}-dashboard-ops.log`
                                ]
                            }
                        ]
                    }
                }
            }
        ]);

    server.auth.strategy('simple', 'basic', { validate });

    if(configuration.dashboard.authentication!=false){
        server.auth.default('simple');
    }

    //register handlebars view engine
    server.views({
        engines: {
            hbs: handlebars
        },
        relativeTo: path.join(__dirname, '..', 'view'),
        // templates that views can render
        path: 'template',
        // layouts that templates can extend
        layoutPath: 'layout',
        // partial elements that can be mixed into pages
        partialsPath: 'partial',
        // helpers to generate snippets programatticaly
        helpersPath: 'helper',
        // sets default layout to 'layout/default.handlebars'
        layout: 'default'
    });

    // configure database connection
     database.setup(configuration.database);


     server.route(router);
    if (configuration.application) {
        // optionally add survey application routes
        server.route({
            method: 'GET',
            path: '/promis/{param*}',
            handler: function (request, h) {

             return h.view('dashboard');
            },
            // handler: {
            //     directory: {
            //         path: configuration.application.path
            //     }
            // },
            config: {
                auth: false
            }
        });
    }
    //server.route(router);
    // server.route({
    //     method: 'GET',
    //     path: '/',
    //     handler: function (request, h) {

    //         return 'welcome to pain portal';
    //     }
    // });

    await server.start();

    return server;
};

//module.exports = dashboardServer;