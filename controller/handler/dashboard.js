
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

/**
 * A dashboard view with overview of all trials and patients.
 * @param {Request} request - Hapi request
 * @param {Reply} reply - Hapi Reply
 * @returns {View} Rendered page
 */
async function dashboardView (request, reply) {
   // const currentDate = new Date();
    let temp = await tempFunc(request,reply);
    console.log(temp);
    let temp1 = temp_func(request,reply);
    console.log(temp1);

    // database.sequelize.query(
    //     queryProp.get('sql.trials')
    //     ,
    //     {
    //         type: database.sequelize.QueryTypes.SELECT,
    //         replacements: [
    //             currentDate.toISOString(),
    //             currentDate.toISOString()
    //         ]
    //     }
    // )
    //     .then((trials) => {
    //         // Process data into format expected in view
    //         const trialData = trials.map(processTrial);

    //         // Display view
    //         return reply.view('dashboard', {
    //             title: parameterProp.get('activity.title'),
    //             user: request.auth.credentials,
    //             trials: trialData
    //         });
    //     })
    //     .catch((err) => {
    //         console.log('error', err);

    //         reply
    //             .view('404', {
    //                 title: 'Not Found'
    //             })
    //             .code(httpNotFound);
    //     });
        return reply.view('dashboard', {
                title: parameterProp.get('activity.title'),
                user: request.auth.credentials,
                //trials: trialData
            }); 
}

async function temp_func(request,reply){

    return "Hello World";
}

async function tempFunc(
    request,reply){
     const currentDate = new Date();
   
    database.sequelize.query(
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
            const trialData = trials.map(processTrial);
            console.log("trials ..." + trials);
            console.log("-----------------------------");
            console.log("trialData : " +trialData );

            return trialData;
            // Display view
            // return reply.view('dashboard', {
            //     title: parameterProp.get('activity.title'),
            //     user: request.auth.credentials,
            //     trials: trialData
            // });
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
