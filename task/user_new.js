'use strict';

/**
 * @module task/user
 * Creates a new user.
 */

const database = require('../model');
const read = require('./helper/read-promise');

database.setupUser(require('../config.json').database);

const userModel = database.sequelize.model('user');

console.log('This utility will walk you through creating a new user.');
console.log('');

const myArgs = process.argv.slice(2);

const newUser = {};

newUser.username = myArgs[0];
newUser.role = myArgs[1];
newUser.password = myArgs[2];

const user = new Promise((resolve, reject) => {
    resolve(userModel.create(newUser));
});

user.then(() => {
    console.log('');
    console.log('user added');

    return database.sequelize.close();
})
.catch((err) => {
    console.error('');
    console.error('/n', 'user could not be created because:');
    console.error(err);

    return database.sequelize.close();
});