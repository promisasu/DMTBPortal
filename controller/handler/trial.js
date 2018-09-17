'use strict';

/**
 * @module controller/handler/trial
 */

const database = require('../../model');
const processTrial = require('../helper/process-trial');
const moment = require('moment');
const processComplianceCount = require('../helper/process-compliance-count');
const processRules = require('../helper/process-rules');
const processPatientStatus = require('../helper/process-patient-status');
const httpNotFound = 404;

const propReader = require('properties-reader');
const queryProp = propReader('query.properties');
const parameterProp = propReader('parameter.properties');

let stages = '';
let endDate = '';
let patientCount = '';
let complianceCount = '';
let currentTrial = '';
let patientArray = '';
let patients = '';
let processCurrentTrial = '';

/**
 * A dashboard with an overview of a specific trial.
 * @param {Request} request - Hapi request
 * @param {Reply} reply - Hapi Reply
 * @returns {View} Rendered page
 */
async function trialView (request, reply) {
    try {
        const trial = database.sequelize.model('trial');
        const startDate = moment.utc('2016-11-23');

        const xCurrentTrial = await trial.findById(request.params.id);
        const xStages = await database.sequelize.query(
            queryProp.get('sql.trialData')
            , {
                type: database.sequelize.QueryTypes.SELECT,
                replacements: [request.params.id]
            }
        );

        const xPatients = await database.sequelize.query(
            queryProp.get('sql.trialCompliance')
            , {
                type: database.sequelize.QueryTypes.SELECT,
                replacements: [
                    request.params.id
                ]
            }
        );

        const compliance = await database.sequelize.query(
            queryProp.get('sql.complianceData')
            , {
                type: database.sequelize.QueryTypes.SELECT,
                replacements: [
                    parameterProp.get('activity.State.expired'),
                    parameterProp.get('activity.biweekly'),
                    parameterProp.get('activity.State.completed'),
                    parameterProp.get('activity.biweekly'),
                    parameterProp.get('activity.State.expired'),
                    parameterProp.get('activity.daily'),
                    parameterProp.get('activity.State.completed'),
                    parameterProp.get('activity.daily'),
                    parameterProp.get('activity.State.pending'),
                    parameterProp.get('activity.State.deactivate'),
                    parameterProp.get('activity.State.expired'),
                    parameterProp.get('activity.biweekly'),
                    parameterProp.get('activity.State.completed'),
                    parameterProp.get('activity.biweekly'),
                    parameterProp.get('activity.State.expired'),
                    parameterProp.get('activity.daily'),
                    parameterProp.get('activity.State.completed'),
                    parameterProp.get('activity.daily'),
                    request.params.id,
                    startDate.toISOString()
                ]
            }
        );

        const missedLastWeek = await database.sequelize.query(
            queryProp.get('sql.surveyBiweekly')
            , {
                type: database.sequelize.QueryTypes.SELECT,
                replacements: [parameterProp.get('activity.biweekly'), parameterProp.get('activity.State.pending')]
            }
        );

        const rules = [];

        if (!xCurrentTrial) {
            throw new Error('trial does not exist');
        }
        const ruleValues = rules.map((ruleData) => {
            return parseInt(ruleData.rule, 10);
        });

        complianceCount = processComplianceCount(compliance);
        patientCount = xPatients.length;
        const patientStatuses = compliance.map(processPatientStatus);

        patientArray = xPatients.map((patient) => {
            const patientStatus = patientStatuses.find((status) => {
                return status.PatientPin === patient.PatientPin;
            });

            let missedWeekly = missedLastWeek.find((missed) => {
                return missed.PatientPinFK === patient.PatientPin;
            });

            if (missedWeekly) {
                if (typeof patient.lastWeekly === 'undefined') {
                    if (missedWeekly.State === 'expired') {
                        patient.lastWeekly = 'Missed';
                    } else if (missedWeekly.State === 'completed') {
                        patient.lastWeekly = 'Taken';
                    }
                }
            } else {
                patient.lastWeekly = ' ---- ';
            }

            // collect the compliance status as well as expiredCount
            if (patientStatus) {
                patient.trialStatus = patientStatus.trialStatus;
                patient.status = patientStatus.status;
                if (isNaN(patientStatus.compliancePercentage)) {
                    patient.compliancePercentage = ' ---- ';
                } else {
                    patient.compliancePercentage = patientStatus.compliancePercentage;
                }
                if (isNaN(patientStatus.trendingCompliance)) {
                    patient.trendingCompliance = ' ---- ';
                } else {
                    patient.trendingCompliance = patientStatus.trendingCompliance;
                }
            } else {
                patient.status = 'Pending';
            }
            patient.DateStarted = moment.utc(patient.DateStarted)
                .format('MM-DD-YYYY');
            patient.DateCompleted = moment.utc(patient.DateCompleted)
                .format('MM-DD-YYYY');

            return patient;
        });

        endDate = processRules(ruleValues, Date.now());
        stages = xStages;
        currentTrial = xCurrentTrial;
        patients = xPatients;

        processCurrentTrial = processTrial(currentTrial);

        return reply.view('trial', {
            title: parameterProp.get('activity.title'),
            trial: processCurrentTrial,
            stages,
            endDate,
            patients: patientArray,
            complianceCount,
            patientCount,
            graphData: JSON.stringify({
                datasets: complianceCount,
                labels: [
                    'Compliant',
                    'Semicompliant',
                    'Noncompliant'
                ]
            })
        });
    } catch (err) {
        console.log('ERRORCUSTOM - ', err);
        request.log('error', err);

        return reply
            .view('404', {
                title: 'Not Found'
            })
            .code(httpNotFound);
    }
}

module.exports = trialView;
