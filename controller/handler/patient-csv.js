'use strict';

/**
 * @module controller/handler/patient-csv
 */

const database = require('../../model');
const convertJsonToCsv = require('../helper/convert-json-to-csv');
const boom = require('boom');
const deduplicate = require('../helper/deduplicate');

const propReader = require('properties-reader');
const queryProp = propReader('query.properties');
const parameterProp = propReader('parameter.properties');

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
function patientCSV (request, reply) {
    database.sequelize.query(
        queryProp.get('sql.csvPatient')
        , {
            type: database.sequelize.QueryTypes.SELECT,
            replacements: [parameterProp.get('activity.State.expired'), parameterProp.get('activity.State.expired'),
                parameterProp.get('activity.State.expired'), parameterProp.get('activity.State.expired'), parameterProp.get('activity.State.expired'),
                parameterProp.get('activity.State.expired'), parameterProp.get('activity.State.expired'), 
                request.params.pin, parameterProp.get('activity.State.completed'),
                parameterProp.get('activity.State.expired'), parameterProp.get('activity.game')]
        }
    )
        .then((optionsWithAnswers) => {
            const property = ['pin', 'name', 'id', 'date', 'questionText', 'questionId'];
            const uniqueAnswers = deduplicate(optionsWithAnswers, property);

            return convertJsonToCsv(uniqueAnswers, configuration);
        })
        .then((csv) => {
            return reply(csv)
                .type('text/csv');
        })
        .catch((err) => {
            console.log('error', err);
            reply(boom.notFound('patient data not found'));
        });
}

module.exports = patientCSV;
