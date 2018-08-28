'use strict';

const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const QueryTypes = {
    SELECT: 'select'
};

test.cb('when survey does not exist', (t) => {
    const model = sinon.stub();
    const query = sinon.stub();

    model
        .withArgs('survey_instance')
        .returns({
            findById () {
                return Promise.resolve(null);
            }
        });

    query
        .onFirstCall()
        .returns(Promise.resolve([]));

    query
        .onSecondCall()
        .returns(Promise.resolve(null));

    const survey = proxyquire('../handler/survey', {
        '../../model': {
            sequelize: {model, query, QueryTypes}
        }
    });

    const request = {
        log: sinon.stub(),
        params: {
            id: Number.NaN
        }
    };

    const reply = () => {
        return {
            type: () => {
                t.end();

                return;
            }
        };
    };

    survey(request, reply);
});
