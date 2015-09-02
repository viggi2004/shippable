'use strict';

var express = require('express');
var controller = require('./thing.controller');

var router = express.Router();

router.get('/getissues', controller.getissues);

module.exports = router;