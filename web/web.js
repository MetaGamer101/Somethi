var express = require('express');
var router = express.Router();

module.exports = router;

//var routeResources = require('./routes/resource.js');
//router.use('/resources', routeResources);
router.use('/resources', express.static(__dirname + '/resources/web'));

var routeHome = require('./routes/page/home.js');
router.get('/', routeHome);
