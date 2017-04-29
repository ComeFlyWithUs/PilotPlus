var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Come Fly with Us | Pilot Plus' });
});

router.get('/api', function(req, res, next) {
    res.json({message: 'hello world'});
});

module.exports = router;
