var express = require('express');
var router = express.Router();

module.exports = router;

var templater = require('./routes/templater.js');

router.all(require('./routes/base.js'));
router.use('/resources', express.static(__dirname + '/resources/web'));

router.get('/', require('./routes/page/home.js'));
router.get('/reference', require('./routes/page/reference.js'));
