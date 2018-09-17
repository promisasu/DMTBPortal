'use strict';

/**
 * @module controller/handler/patient
 */

const database = require('../../model');
const processSurveyInstances = require('../helper/process-survey-instances');
const processPatientStatus = require('../helper/process-patient-status');
const moment = require('moment');
const httpNotFound = 404;

const propReader = require('properties-reader');
const queryProp = propReader('query.properties');
const parameterProp = propReader('parameter.properties');

const json = parameterProp.get('score.category');
let patientStatus = '';
let deactivateStatus = false;

let x_currentPatient = '';
let x_currentTrial = '';
let x_surveyInstances = '';
let x_dataChart = '';
let x_clinicalValuesChart = '';

/**
 * A dashboard with an overview of a specific patient.
 * @param {Request} request - Hapi request
 * @param {Reply} reply - Hapi Reply
 * @returns {View} Rendered page
 */
async function patientView (request, reply) {
    let parsedJson = JSON.parse(json);
    let listOfQuestionScore = [];

    for (let i = 0; i < parsedJson.score_type.length; i++) {
        for (let j = 0; j < parsedJson.score_type[i].questionID.length; j++) {
            listOfQuestionScore.push(parsedJson.score_type[i].questionID[j]);
        }
    }

    try {
        const currentPatient = await database.sequelize.query(
            queryProp.get('sql.currentPatient')
            , {
                type: database.sequelize.QueryTypes.SELECT,
                replacements: [
                    parameterProp.get('activity.State.pending'),
                    parameterProp.get('activity.State.deactivate'),
                    request.params.pin
                ],
                plain: true
            }
        );

        const surveyInstances = await database.sequelize.query(
            queryProp.get('sql.surveyInstances')
            , {
                type: database.sequelize.QueryTypes.SELECT,
                replacements: [request.params.pin, parameterProp.get('activity.game'),
                    parameterProp.get('activity.initial')]
            }
        );

        const currentTrial = await database.sequelize.query(
            queryProp.get('sql.currentTrial')
            , {
                type: database.sequelize.QueryTypes.SELECT,
                replacements: [
                    request.params.pin
                ],
                plain: true
            }
        );

        const surveyResults = await database.sequelize.query(
            queryProp.get('sql.surveyResults')
            , {
                type: database.sequelize.QueryTypes.SELECT,
                replacements: [request.params.pin, parameterProp.get('activity.State.completed'),
                    parameterProp.get('activity.biweekly')]
            }
        );

        const opioidResults = await database.sequelize.query(
            queryProp.get('sql.opioidResults')
            , {
                type: database.sequelize.QueryTypes.SELECT,
                replacements: [request.params.pin, parameterProp.get('activity.State.completed'),
                    parameterProp.get('activity.daily')]
            }
        );

        const bodyPainResults = await database.sequelize.query(
            queryProp.get('sql.bodyPainResults')
            , {
                type: database.sequelize.QueryTypes.SELECT,
                replacements: [request.params.pin, parameterProp.get('activity.State.completed')]
            }
        );

        const dailySurvey = await database.sequelize.query(
            queryProp.get('sql.dailySurvey')
            , {
                type: database.sequelize.QueryTypes.SELECT,
                replacements: [request.params.pin, parameterProp.get('activity.State.completed'),
                    parameterProp.get('activity.daily')]
            }
        );

        const getScoreData = await database.sequelize.query(
            queryProp.get('sql.getScoreData')
            , {
                type: database.sequelize.QueryTypes.SELECT,
                replacements: [request.params.pin, parameterProp.get('activity.State.completed'),
                    listOfQuestionScore]
            }
        );

        let dataChart = processSurveyInstances(surveyInstances);

        if (!currentPatient) {
            throw new Error('patient does not exist');
        }
        let clinicalValuesChart = processSurveyInstances.processClinicanData(
            surveyInstances, surveyResults, bodyPainResults, opioidResults, getScoreData
        );

        if (currentPatient.deactivatedCount > 0) {
            patientStatus = 'Deactivated';
            deactivateStatus = true;
        } else if (currentPatient.pendingCount > 0) {
            patientStatus = 'Active';
            deactivateStatus = false;
        } else {
            patientStatus = 'Completed';
            deactivateStatus = false;
        }

        return reply.view('patient', {
            title: parameterProp.get('activity.title'),
            status: patientStatus,
            deactivate: deactivateStatus,
            patient: currentPatient,
            trial: currentTrial,
            surveys: surveyInstances.map((surveyInstance) => {
                const surveyInstanceCopy = Object.assign({}, surveyInstance);

                surveyInstanceCopy.startTime = moment.utc(surveyInstanceCopy.StartTime)
                    .format('MM-DD-YYYY');
                surveyInstanceCopy.endTime = moment.utc(surveyInstanceCopy.EndTime)
                    .format('MM-DD-YYYY');
                if (surveyInstanceCopy.UserSubmissionTime) {
                    surveyInstanceCopy.UserSubmissionTime = moment.utc(surveyInstanceCopy.UserSubmissionTime)
                        .format('MM-DD-YYYY h:mma');
                }
                if (surveyInstanceCopy.ActualSubmissionTime) {
                    surveyInstanceCopy.ActualSubmissionTime = moment.utc(surveyInstanceCopy.ActualSubmissionTime)
                        .format('MM-DD-YYYY h:mma');
                }

                return surveyInstanceCopy;
            }),
            datesJson: JSON.stringify(dataChart),
            clinicalValues: JSON.stringify(clinicalValuesChart)
        });
    } catch (err) {
        console.log(err);
        request.log('error', err);

        return reply
            .view('404', {
                title: 'Not Found'
            })
            .code(httpNotFound);
    }
}

module.exports = patientView;
