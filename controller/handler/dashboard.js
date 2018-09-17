
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
    let transaction = null;

    try {
        transaction = await database.sequelize.query(
            queryProp.get('sql.trials')
            ,
            {
                type: database.sequelize.QueryTypes.SELECT,
                replacements: [
                    currentDate.toISOString(),
                    currentDate.toISOString()
                ]
            }
        );
        trialData = transaction.map(processTrial);

        return reply.view('dashboard', {
            title: parameterProp.get('activity.title'),
            user: {username: request.auth.credentials.name},
            trials: trialData
        });
    } catch (err) {
        console.log('error', err);

        return reply
            .view('404', {
                title: 'Not Found'
            })
            .code(httpNotFound);
    }
}

module.exports = dashboardView;
