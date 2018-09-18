'use strict';

/**
 * @module task/dev-dashboard
 * Starts the dashboard in the console process.
 * This allows for `console.log` to be used for debugging.
 */

const config = require('../../config.json');
const Server = require('../../controller/server');

/**
 * A function to start the dashboard
 * @returns {null} Nothing
 */
async function start () {
    try {
        const server = await Server.dashboardServer(config);

        await server.start();
        console.log('Server running at:', server.info.uri);
    } catch (err) {
        console.log(err);

        return err;
    }

    return null;
}

start();

