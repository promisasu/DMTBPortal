'use strict';

/**
 * @module task/init
 * Writes a server configuration file.
 */

const bcrypt = require('bcrypt');
const path = require('path');
const read = require('./helper/read-promise');
const writeFile = require('./helper/write-file-promise');
const genSalt = require('./helper/gen-salt-promise');
const numberOfHashIterations = 10;
const jsonIndent = 2;

const config = {};

console.log('This utility will walk you through creating a config.json file.');
console.log('It only covers the most common items, and tries to guess sensible defaults.');
console.log('');
console.log('general setup for project');
console.log('');

const myArgs = process.argv.slice(2);

config.environment = myArgs[0];
config.dashboard = {};
config.dashboard.hostname = myArgs[1];
config.dashboard.port = parseInt(myArgs[2]);
config.database = {};
config.database.hostname = myArgs[3];
config.database.name = myArgs[4];
config.database.username = myArgs[5];
config.database.password = myArgs[6];
config.database.dialect = myArgs[7];

const salt = bcrypt.genSaltSync(numberOfHashIterations);

if (salt) {
    config.database.salt = salt;
}

config.webFormPostUrl = myArgs[8];
config.apiURL = myArgs[9];

config.opioid = {};
config.opioid.Tramadol = parseFloat(myArgs[10]);
config.opioid.Oxycodone = parseFloat(myArgs[11]);

config.opioid.Dilaudid = parseFloat(myArgs[12]);

// Gotta get rid of these dependencies in the near future
config.api = {};
config.api.hostname = 'localhost';
config.api.port = 3001;

return writeFile(path.resolve(__dirname, '..', 'config.json'), JSON.stringify(config, null, jsonIndent));
