var express = require('express');
var router = express.Router();
var request = require("request");

router.get('/getPlaces', function (req, res, next) {
    var options = { method: 'GET',
    url: 'https://qlb5gy2eu5.execute-api.eu-west-1.amazonaws.com/prod/print-list',
    headers: { 'content-type': 'application/json' },
    json: true };

    request(options, function (error, response, body) {
        if (error)
            throw new Error(error);

        res.json(response);
    });

});

module.exports = router;