'use strict';

/**
 * @module controller/helper/validate
 */

const compare = require('./compare-promise');
const database = require('../../model');

/**
 * Checks that a login is valid
 * @param {Object} request - Hapi request
 * @param {String} username - username for login
 * @param {String} password - password for login
 * @param {Function} callback - alerts Hapi if login is valid or not
 * @returns {Null} nothing
 */
function validate (request, username, password, callback) {
    try {
        const user = database.sequelize.model('user');

        // search for selected user
        const selectedUser = user.find({where: {username}});

        // if user does not exist error out
        if (!selectedUser) {
            throw new Error('invalid login');
        }

        // test that the password given matches the password stored
        const isValid = compare(password, selectedUser.passwordHash);

        return callback(null, isValid, selectedUser);
    } catch (err) {
        request.log('error', err);

        return callback(null, false, null);
    }
}

module.exports = validate;
