'use strict';

/**
 * @module controller/handler/create-trial
 */

const boom = require('boom');
const database = require('../../model');

/**
 * Creates a new Trial
 * @param {Request} request - Hapi request
 * @param {Reply} reply - Hapi Reply
 * @returns {Null} Redirect
 */
async function createTrial (request, reply) {
    const trial = database.sequelize.model('trial');
    const stage = database.sequelize.model('stage');
    const transaction = await database.sequelize.transaction();

    try {
        const newTrial = await trial.create(
            {
                name: request.payload.name,
                description: request.payload.description,
                IRBID: request.payload.IRBID,
                IRBStart: request.payload.IRBStart,
                IRBEnd: request.payload.IRBEnd,
                targetCount: request.payload.targetCount
            },
            {
                transaction
            }
        );

        const stageNames = request.payload.stageName.split(',');

        if (stageNames.length !== request.payload.stagecount) {
            throw new Error(
                'No of Stages not matched with Stage Schedule information given'
            );
        }

        const newStages = await Promise.all(
            stageNames.map((name) => {
                return stage.create({name}, {transaction});
            })
        );

        await newTrial.addStages(newStages, {transaction});

        await transaction.commit();

        reply.redirect(`/trial/${newTrial.id}`);
    } catch (err) {
        transaction.rollback();
        request.log('error', err);
        reply(boom.badRequest('Invalid Trial'));
    }
}

module.exports = createTrial;
