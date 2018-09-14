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

/**
 * Checks that a login is valid
 * @param {Object} request - Hapi request
 * @param {String} username - username for login
 * @param {String} password - password for login
 * @param {Object} h - Hapi response
 * @returns {Boolean} - Value to check whether credentials are correct
 * @returns {Array<Object>} - Id and username of the user
 */
async function validate (request, username, password, h) {
    const user = database.sequelize.model('user');
    let selectedUser = null;

    await user
        .find({
            where: {
                username
            }
        })
        // if user does not exist error out
        .then((currentUser) => {
            selectedUser = currentUser;

            if (!selectedUser) {
                throw new Error('invalid login');
            }

            return;
        });

    const isValid = await Bcrypt.compare(password, selectedUser.passwordHash);
    const credentials = {id: selectedUser.id, name: selectedUser.username};

    return {isValid, credentials};
}

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

    server.auth.strategy('simple', 'basic', {validate});

    if (configuration.dashboard.authentication !== false) {
        server.auth.default('simple');
    }

    // register handlebars view engine
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
            handler: {
                directory: {
                    path: configuration.application.path
                }
            },
            config: {
                auth: false
            }
        });
    }

    await server.start();

    return server;
};

