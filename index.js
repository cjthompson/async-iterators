'use strict';

const funcs = require('./lib/iteratorFunctions');
const asyncIterator = require('./lib/asyncIterator');

module.exports = Object.assign({}, funcs, asyncIterator);
