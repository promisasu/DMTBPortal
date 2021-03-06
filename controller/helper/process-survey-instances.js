'use strict';

/**
 * @module controller/helper/process-survey-instances
 */

const moment = require('moment');
const calculateScores = require('../helper/calculate-scores');

const sqlDateFormat = 'ddd MMM DD YYYY HH:mm:ss ZZ';
const viewDateFormat = 'MM-DD-YYYY HH:mm';

const propReader = require('properties-reader');
const queryProp = propReader('query.properties');
const parameterProp = propReader('parameter.properties');
const json = parameterProp.get('score.category');

/**
 * Takes in a Survey Instances and processes it to get Complience chart details
 * @param {Array<Object>} surveys - list of survey instances
 * @returns {Object} Complience chart data
 */
function processSurveyInstances (surveys) {
    const filterSurveyByState = surveys.filter((survey) =>
        survey.state === 'completed'
    );
    let datasets = pickTimeLeft(filterSurveyByState);
    let labels = [];

    for (let i = 0; i < datasets.length; i++) {
        let dataSet = datasets[i];
        let y = dataSet.data;
        let x = dataSet.dates;

        datasets[i].data = [];
        for (let j = 0; j < x.length; j++) {
            datasets[i].data.push({
                'x': x[j],
                'y': y[j]
            });
        }
        labels.push.apply(labels, dataSet.dates);
    }

    const numberOfDays = 1;
    const endDateforChart = moment.utc(labels[labels.length - 1], viewDateFormat)
        .add(numberOfDays, 'day');

    labels.push(moment.utc(endDateforChart)
        .format(viewDateFormat));

    return {
        labels: labels,
        datasets: datasets
    };
}

/**
 * Takes in a Survey Instances and get the % time left to be shown on complience chart
 * @param {Object} surveys - list of survey instances
 * @returns {Object} processed list of datetimes
 */
function pickDates (surveys) {
    const dates = surveys.map((survey) =>
        moment.utc(survey.StartTime)
            .format(viewDateFormat)
    );

    if (surveys[0]) {
        // Adding an additional week to include all the dates in compliance chart.
        // This is done because chart js plots only the first day of the week.
        const numberOfDays = 1;
        const endDateforChart = moment.utc(surveys[surveys.length - 1].EndTime)
            .add(numberOfDays, 'day');

        dates.push(moment.utc(endDateforChart)
            .format(viewDateFormat));
    }

    return dates;
}

/**
 * Takes in a Survey Instances and get the % time left to be shown on complience chart
 * @param {Array<Object>} surveys - list of survey instances
 * @returns {Object} processed list of % time left data
 */
function pickTimeLeft (surveys) {
    let surveySet = new Set();

    for (let i = 0; i < surveys.length; i++) {
        surveySet.add(surveys[i].activityTitle);
    }
    let surveyTypes = [];

    for (let activityTitle of surveySet) {
        surveyTypes.push(surveys.filter((survey) =>
            survey.activityTitle === activityTitle
        ));
    }

    let returnArray = [];

    for (let i = 0; i < surveyTypes.length; i++) {
        if (surveyTypes[i].length > 0) {
            let samplePoint = surveyTypes[i][0];

            let dataPoints = surveyTypes[i].map((survey) =>
                calculateTimeLeft(
                    moment.utc(survey.StartTime),
                    moment.utc(survey.EndTime),
                    moment.utc(survey.ActualSubmissionTime)
                )
            );

            let dates = surveyTypes[i].map((survey) =>
                moment.utc(survey.ActualSubmissionTime)
                    .format(viewDateFormat)
            );
            let dataArr = {
                label: '% Time left until ' + samplePoint.activityTitle + ' expired',
                backgroundColor: getRGBA(),
                borderColor: getRGBA(),
                pointBorderColor: getRGBA(),
                pointBorderWidth: 5,
                pointRadius: 5,
                data: dataPoints,
                dates: dates
            };

            returnArray.push(dataArr);
        }
    }

    return returnArray;
}

/**
 * Takes in a Survey Instances and get the % time left to be shown on complience chart
 * @param {Moment} openTime - When survey instance became availible
 * @param {Moment} endTime - When the survey instance is no longer availible to be taken
 * @param {Moment} completedTime - When the survey instance was actually completed
 * @returns {Number} percent time left after completing survey instance
 */
function calculateTimeLeft (openTime, endTime, completedTime) {
    const percent = 100;
    const minTime = 0;

    // calculate the time in hours until end time
    const totalAvailibleTime = endTime.diff(openTime, 'hours');

    let percentTimeLeft = minTime;

    if (completedTime !== null && !isNaN(completedTime)) {
        const timeTaken = endTime.diff(completedTime, 'hours');

        // caculate percent of time taken out of total time availible to take the survey
        percentTimeLeft = Math.round(timeTaken / totalAvailibleTime * percent);
    }

    // either take the amount of time left
    // or if the survey instance expired (negative percent) show zero time left
    return Math.max(percentTimeLeft, minTime);
}

/**
 * Takes in a Survey Instances and processes to get opioid equivalence
 * @param {Array<Object>} surveys - list of survey instances
 * @param {Array<Object>} surveyDetails - list of survey instances
 * @param {Array<Object>} bodyPainResults - list of body pain questions answered
 * @param {Array<Object>} opioidResults - list of survey instances
 * @param {Array<Object>} scoreValue - list of questions for calculating score
 * @returns {Array<Object>} data for the chart
 */
function processClinicanData (surveys, surveyDetails, bodyPainResults, opioidResults, scoreValue) {
    let labels = surveys.map((survey) =>
        moment.utc(survey.StartTime)
            .format(viewDateFormat)
    );

    const numberOfDays = 1;
    const endDateforChart = moment.utc(labels[labels.length - 1], viewDateFormat)
        .add(numberOfDays, 'day');

    labels.push(moment.utc(endDateforChart)
        .format(viewDateFormat));

    let datasets = pickClinicianDataset(surveys, surveyDetails, bodyPainResults, opioidResults, labels, scoreValue);

    return {
        labels: labels,
        datasets: datasets
    };
}

let darkPink = 'rgba(250, 29, 150,1)';
let pink = 'rgba(254, 160,172, 1)';
//  let green = 'rgba(122, 198,150, 1)';
let yellow = 'rgba(182, 29,57, 1)';
//  let blue = 'rgba(2, 117,216, 0.6)';
let white = 'rgba(255,255,255, 0.9)';
let darkBrown = 'rgba(101,56,33, 1)';
let gray = 'rgba(76,76,76, 1)';
let violet = 'rgba(119,65,119, 1)';

/**
 * Takes in a Survey Instances and processes to get opioid equivalence
 * @param {Array<Object>} surveys - list of survey instances
 * @param {Array<Object>} surveyDetails - list of survey instances
 * @param {Array<Object>} bodyPainResults - list of body pain answers
 * @param {Array<Object>} opioidResults - list of survey instances
 * @param {Array<Object>} labels - labels for the chart
 * @param {Array<Object>} scoreValue - list of questions for calculating score
 * @returns {Array<Object>} data for the chart
 */
function pickClinicianDataset (surveys, surveyDetails, bodyPainResults, opioidResults, labels, scoreValue) {
    let dataPoints = [];
    let datasets = [];

    let parsedJson = JSON.parse(json);
    let queryList = [];

    for (let i = 0; i < parsedJson.score_type.length; i++) {
        let filterTemp = '';

        filterTemp = scoreValue.filter((score) =>
            (parsedJson.score_type[i].questionID.indexOf(score.questionId) > -1)
        );
        queryList.push(filterTemp);
    }

    for (let i = 0; i < queryList.length; i++) {
        dataPoints.push({
            label: parsedJson.score_type[i].category,
            data: getDMTBScore(queryList[i], labels, parsedJson.score_type[i].category),
            color: getRGBA()
        });
    }
    for (let i = 0; i < dataPoints.length; i++) {
        datasets.push({
            label: dataPoints[i].label,
            fill: false,
            backgroundColor: dataPoints[i].color,
            borderColor: dataPoints[i].color,
            pointBorderColor: dataPoints[i].color,
            pointBackgroundColor: white,
            pointBorderWidth: 5,
            pointRadius: 5,
            data: dataPoints[i].data,
            spanGaps: true
        });
        if (dataPoints[i].label === 'Opoid Threshold') {
            datasets[i].borderDash = [10, 5];
            datasets[i].pointBorderWidth = 0;
            datasets[i].radius = 0;
            delete datasets[i].pointBorderColor;
            delete datasets[i].pointBackgroundColor;
            delete datasets[i].pointBorderWidth;
            delete datasets[i].pointRadius;
        }
    }

    return datasets;
}

/**
 * Takes in a Survey Instances and processes to get opioid equivalence
 * @param {Array<Object>} surveyDetails - list of survey instances
 * @param {Array<Object>} labels - labels for the chart
 * @param {String} problemType - category of the score
 * @returns {Array<Object>} data for the chart
 */
function getDMTBScore (surveyDetails, labels, problemType) {
    let promisScores = calculateScores.calculateDMTBScore(surveyDetails, problemType);

    return createMultiLinePoints(promisScores[0], labels, 1);
}

/**
 * Generates and returns random colors
 * @returns {Object} processed list of datetimes
 */
function getRGBA () {
    let red = Math.floor(Math.random() * 255) + 1;
    let green = Math.floor(Math.random() * 255) + 1;
    let blue = Math.floor(Math.random() * 255) + 1;

    return 'rgba(' + red.toString() + ',' + green.toString() + ',' + blue.toString() + ',0.5)';
}

/**
 * Takes in a Survey Instances and processes to compute PROMIS score
 * @param {Array<Object>} data - list of survey instances
 * @param {Array<Object>} labels - labels for the chart
 * @param {Number} conversionFactor - conversion factor for normalization
 * @returns {Array<Object>} data for the chart
 */
function createMultiLinePoints (data, labels, conversionFactor = -1) {
    let returnData = [];
    let j = 0;

    for (let i = 0; i < labels.length; i++) {
        if (data[j] && labels[i] === data[j].x && j > -1) {
            returnData.push(data[j].y);
            if (j === data.length) {
                j = -1;
            } else {
                j += 1;
            }
        } else {
            returnData.push(null);
        }
    }

    return normalizeValues(returnData, conversionFactor);
}

/**
 * Takes in a Survey Instances and processes to compute PROMIS score
 * @param {Array<Object>} data - list of survey instances
 * @param {Number} conversionFactor - conversion factor for normalization
 * @returns {Array<Object>} data for the chart
 */
function normalizeValues (data, conversionFactor = -1) {
    let max = 0;
    let i = 0;

    for (i = 0; i < data.length; i++) {
        if (data[i] !== null && max < data[i]) {
            max = data[i];
        }
    }
    let newConversionFactor = conversionFactor;

    if (conversionFactor === -1) {
        newConversionFactor = 100 / max;
    }
    for (i = 0; i < data.length; i++) {
        if (data[i] !== null) {
            data[i] *= newConversionFactor;
        }
    }

    return data;
}

/**
 * Takes in a Survey Instances and processes to compute PROMIS score
 * @param {Array<Object>} surveys - list of survey instances
 * @returns {Array<Object>} data for the chart
 */
function calculatePromisScore (surveys) {
    // Filter out the surveys that you are going to process, eg, Daily or weekly endDateforChart
    // Calculate the promis score for each surveys
    // Calculate the labels for your filtered surveys.
    // let dates = surveys.map((survey) => {
    //     return moment(survey.StartTime).format(viewDateFormat);
    // });
    // Return data like so [{x:<label>,y:<value>},{x:<label>,y:<value>}]
}

/**
 * Takes in a value and checks whether the value is an integer
 * @param {Integer} value - to be checked for integer
 * @returns {Boolean} return true if the number is an integer or false otherwise
 */
function isInt (value) {
    return !isNaN(value) && ((x) =>
        (x | 0) === x
    )(parseFloat(value));
}

module.exports = processSurveyInstances;
module.exports.pickDates = pickDates;
module.exports.pickTimeLeft = pickTimeLeft;
module.exports.calculateTimeLeft = calculateTimeLeft;
module.exports.processClinicanData = processClinicanData;
