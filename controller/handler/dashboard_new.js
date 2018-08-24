
'use strict';

/**
 * @module controller/handler/dashboard
 */
const processTrial = require('../helper/process-trial');
const database = require('../../model');
const httpNotFound = 404;
var isMac = process.platform === "darwin";
/**
 * A dashboard view with overview of all trials and patients.
 * @param {Request} request - Hapi request
 * @param {Reply} reply - Hapi Reply
 * @returns {View} Rendered page
 */
function dashboardView (request, reply) {
    const currentDate = new Date();

    if(isMac){

        Promis.all([
         database.sequelize.query(
        `
        SET GLOBAL sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'
        `,
        )

          database.sequelize.query(
        `
        SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'
        `,
        )
        ])
        .then((global,session) => {
            // Process data into format expected in view
           // if(tirals.indexOf('OK')>-1){}
            return sql_mode
        })
        .catch((err) => {
            console.log('error', err);

            return err;
    }

    database.sequelize.query(
        `
        SELECT t.*, s.StageId, count(1) as recruitedCount from trial t, stage s
        INNER JOIN patients pa ON s.StageId = pa.StageIdFK  WHERE t.TrialId = s.trialId;

        `,
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
            const trialData = trials.map(processTrial);

            // Display view
            return reply.view('dashboard', {
                title: 'Pain Reporting Portal',
                user: request.auth.credentials,
                trials: trialData
            });
        })
        .catch((err) => {
            console.log('error', err);

            reply
            .view('404', {
                title: 'Not Found'
            })
            .code(httpNotFound);
        });
}

module.exports = dashboardView;
