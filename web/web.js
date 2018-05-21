var express = require('express');
var router = express.Router();

module.exports = router;

var routeResources = require('./routes/resource.js');
router.use('/resources', routeResources);

var routeHome = require('./routes/page/home.js');
router.get('/', routeHome);
