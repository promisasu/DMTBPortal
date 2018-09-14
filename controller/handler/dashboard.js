
'use strict';

/**
 * @module controller/handler/dashboard
 */
const processTrial = require('../helper/process-trial');
const database = require('../../model');
const httpNotFound = 404;
const propReader = require('properties-reader');
const queryProp = propReader('query.properties');
const parameterProp = propReader('parameter.properties');
let trialData = '';
let username = '';

/**
 * A dashboard view with overview of all trials and patients.
 * @param {Request} request - Hapi request
 * @param {Reply} reply - Hapi Reply
 * @returns {View} Rendered page
 */
async function dashboardView (request, reply) {
    const currentDate = new Date();

    await database.sequelize.query(
        queryProp.get('sql.trials')
        ,
        {
            type: database.sequelize.QueryTypes.SELECT,
            replacements: [
                currentDate.toISOString(),
                currentDate.toISOString()
            ]
        }
    )
        .then((trials) => {
            // Process data into format expected in view
            trialData = trials.map(processTrial);

            return;
        })
        .catch((err) => {
            console.log('error', err);

            reply
                .view('404', {
                    title: 'Not Found'
                })
                .code(httpNotFound);
        });

    return reply.view('dashboard', {
        title: parameterProp.get('activity.title'),
        user: {username: request.auth.credentials.name},
        trials: trialData
    });
}

module.exports = dashboardView;
