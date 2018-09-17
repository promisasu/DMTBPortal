'use strict';

/**
 * @module controller/handler/create-patient
 */

const boom = require('boom');
const database = require('../../model');
const trialOffset = 1000;
const createSurvey = require('../helper/create-survey-instance');

/**
 * Creates a new Patient
 * @param {Request} request - Hapi request
 * @param {Reply} reply - Hapi Reply
 * @returns {Null} Redirect
 */
async function createPatient (request, reply) {
    const patient = database.sequelize.model('patient');
    const trial = database.sequelize.model('trial');
    const stage = database.sequelize.model('stage');
    const joinStageSurveys = database.sequelize.model('join_stages_and_surveys');
    let transaction = await database.sequelize.transaction();
    let newPatient = null;
    let pin = null;

    try {
        const x_newPatient = await trial.findById(request.payload.trialId, {transaction});

        pin = x_newPatient.id * trialOffset + x_newPatient.patientPinCounter;
        const x_currTrial = await x_newPatient.increment({patientPinCounter: 1}, {transaction});

        const dateStarted = request.payload.startDate;
        const dateCompleted = request.payload.endDate;

        const x_createPatient = await patient.create({pin, dateStarted, dateCompleted}, {transaction});

        newPatient = x_createPatient;

        const x_stage = await stage.findById(request.payload.stageId, {transaction});
        const x_addPatientStage = x_stage.addPatient(newPatient, {transaction});

        const x_findStage = joinStageSurveys.findOne(
            {
                where: {
                    stageId: request.payload.stageId,
                    stagePriority: 0
                },
                transaction
            }
        );

        const startDate = request.payload.startDate;
        const openUnit = 'day';
        let openFor = null;

        if (x_findStage.rule === 'daily') {
            openFor = 1;
        } else {
            openFor = 2;
        }

        await createSurvey(
            pin,
            x_findStage.surveyTemplateId,
            startDate,
            openFor,
            openUnit,
            transaction
        );
        await transaction.commit();

        reply.redirect(`/patient/${newPatient.pin}?newPatient=true`);
    } catch (err) {
        transaction.rollback();
        request.log('error', err);
        reply(boom.badRequest('Patient could not be created'));
    }
}

module.exports = createPatient;
