'use strict';

/**
 * @module controller/helper/create-survey-instance
 */

const moment = require('moment');
const database = require('../../model');

/**
 * Creates a survey instance for a patient to complete
 * @param {Number} patientPin - Identifier for patient who needs a survey
 * @param {Number} surveyTemplateId - Identifier for Survey Template that contains questions to be answered
 * @param {Date} startDate - Datetime that survey will become availible
 * @param {Number} openForDuration - How long patient has to complete the survey
 * @param {String} openForUnit - Unit of time for openForDuration (hours, days, weeks)
 * @param {Transaction} transaction - DB transaction to group operations
 * @returns {Null} Returns when completed
 */
async function createSurveyInstance (patientPin, surveyTemplateId,
    startDate, openForDuration, openForUnit, transaction) {
    try {
        const patient = database.sequelize.model('patient');
        const surveyTemplate = database.sequelize.model('survey_template');
        const surveyInstance = database.sequelize.model('survey_instance');
        let newSurveyInstance = '';

        const currentPatient = await patient.findOne(
            {
                where: {
                    pin: patientPin
                },
                transaction
            }
        );

        const currentSurveyTemplate = await surveyTemplate.findById(surveyTemplateId, {transaction});

        newSurveyInstance = await surveyInstance.create(
            {startTime: startDate,
                endTime: moment.utc(startDate)
                    .add(openForDuration, openForUnit)
            },
            {transaction}
        );
        if (!currentPatient) {
            throw new Error('patient does not exist');
        }

        if (!currentSurveyTemplate) {
            throw new Error('survey template does not exist');
        }

        return Promise.all([
            currentSurveyTemplate.addSurvey_instance(newSurveyInstance, {transaction}),
            currentPatient.addSurvey_instance(newSurveyInstance, {transaction})
        ]);
    } catch (err) {
        console.log(err);

        return err;
    }
}

module.exports = createSurveyInstance;
