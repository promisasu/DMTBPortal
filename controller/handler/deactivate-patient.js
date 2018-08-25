'use strict';

/**
 * @module controller/handler/deactivate-patient
 */

const boom = require('boom');
const database = require('../../model');
const moment = require('moment');

var propReader = require('properties-reader');
var queryProp = propReader('query.properties');
var parameterProp = propReader('parameter.properties');


/**
 * Deactivates a patient
 * @param {Request} request - Hapi request
 * @param {Reply} reply - Hapi Reply
 * @returns {Null} Redirect
 */
function deactivatePatient (request, reply) {

        Promise
      .all([
          database.sequelize.query(
          queryProp.get('sql.deacivatePatient')
          , {
              type: database.sequelize.QueryTypes.UPDATE,
              replacements: [parameterProp.get('activity.deactivate'),parameterProp.get('activity.currentstate'),moment.utc().format('YYYY-MM-DD HH:mm:ss'),request.params.pin],
              plain: true
          }
        ),
          database.sequelize.query(
            queryProp.get('sql.setCompleteDate')
          , {
              type: database.sequelize.QueryTypes.UPDATE,
              replacements: [moment.utc().format('YYYY-MM-DD HH:mm:ss'),request.params.pin],
              plain: true
          }
        ),
          database.sequelize.query(
              queryProp.get('sql.deleteDeactivated')
              , {
                  type: database.sequelize.QueryTypes.UPDATE,
                  replacements: [parameterProp.get('activity.deactivate'),moment.utc().format('YYYY-MM-DD HH:mm:ss'),request.params.pin,parameterProp.get('activity.biweekly'),parameterProp.get('activity.daily')],
                  plain: true
              }
        )
      ])
      .then(() => {
          return reply();
      }).catch((err) => {
          request.log('error', err);
          console.log(err);

          return reply(boom.conflict());
      });
}

module.exports = deactivatePatient;
