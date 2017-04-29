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

// http://localhost:8081/api/getAirports?lat=50.727622&long=-3.475646&radius=50000
router.get('/getAirports', function (req, res, next) {
    var lat = req.param('lat');
    var long = req.param('long');
    var radius = req.param('radius');
    console.log(lat);
    console.log(long);
    var baseUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
    var key = "AIzaSyBA1clTuoA4xzkQaqYdmLlM5VDVQeue8sE";
    var url = baseUrl + "?key=" + key + "&location=" + lat + ","+ long + "&radius=" + radius + "&type=airport";

    var options = { method: 'GET',
      url: url,
      headers: { 'content-type': 'application/json' },
      json: true
    };

    request(options, function (error, response, body) {
        if (error)
            throw new Error(error);
            var listOfPlaces = [];
            var results = response.body.results;
            console.log(response);
            console.log(results);
            for (var i=0; i<results.length; i++){
              var result = {};
              result.name = results[i].name;
              result.lat = results[i].geometry.location.lat;
              result.long = results[i].geometry.location.lng;
              listOfPlaces.push(result);
            }
        res.json(listOfPlaces);
    });


});

module.exports = router;
