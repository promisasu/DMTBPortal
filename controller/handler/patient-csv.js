'use strict';

/**
 * @module controller/handler/patient-csv
 */

const database = require('../../model');
const convertJsonToCsv = require('../helper/convert-json-to-csv');
const boom = require('boom');
const deduplicate = require('../helper/deduplicate');
const configuration = [
    {
        label: 'Patient Pin',
        key: 'pin',
        default: ''
    },
    {
        label: 'Survey Title/Type',
        key: 'name',
        default: ''
    },
    {
        label: 'Survey Activity Id',
        key: 'id',
        default: ''
    },
    {
        label: 'Date Survey Completed',
        key: 'date',
        default: ''
    },
    {
        label: 'Question Id',
        key: 'questionId',
        default: ''
    },
    {
        label: 'Question',
        key: 'questionText',
        default: ''
    },
    {
        label: 'Answer',
        key: 'optionText',
        default: ''
    },
    {
        label: 'Dosage',
        key: 'dosage',
        default: ''
    },
    {
        label: 'Value',
        key: 'Value',
        default: ''
    }
];

/**
 * Create a Comma Seperate Value export of a single patient's data.
 * @param {Request} request - Hapi request
 * @param {Reply} reply - Hapi Reply
 * @returns {View} Rendered page
 */
function patientCSV(request, reply) {
    database.sequelize.query(
        `SELECT ai.PatientPinFK AS pin, ai.activityTitle AS name, ai.UserSubmissionTime AS date, ai.ActivityInstanceId 
       AS id, act.questionIdFk AS questionId, que.QuestionText AS questionText, act.questionOptionIdFk AS optionId,
       ans.OptionText AS optionText, act.dosage, act.value FROM activity_instance ai
       LEFT JOIN question_result act ON act.ActivityInstanceIdFk = ai.ActivityInstanceId
       LEFT JOIN questions que ON act.questionIdFk = que.QuestionId
       LEFT JOIN question_options ans ON act.questionOptionIdFk = ans.QuestionOptionId
       WHERE ai.ActivityInstanceId
       IN (SELECT ActivityInstanceId FROM activity_instance WHERE PatientPinFK = ? AND (State ='completed' OR 
       State ='expired') AND activityTitle != 'Fruit Run') ORDER BY id;
        `,
        {
            type: database.sequelize.QueryTypes.SELECT,
            replacements: [
                request.params.pin
            ]
        }
    )
        .then((optionsWithAnswers) => {
            const property = ['pin', 'name', 'id', 'date', 'questionText', 'questionId'];
            const uniqueAnswers = deduplicate(optionsWithAnswers, property);

            return convertJsonToCsv(uniqueAnswers, configuration);
        })
        .then((csv) => {
            return reply(csv).type('text/csv');
        })
        .catch((err) => {
            console.log('error', err);
            reply(boom.notFound('patient data not found'));
        });
}

module.exports = patientCSV;
