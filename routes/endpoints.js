var express = require('express');
var router = express.Router();
var request = require("request");
var async = require("async");
var asyncTasks = [];
var listToReturn = [];



function getPlaces(lat, long, radius, type) {
  return function(cb){
    var baseUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
    //var key = "AIzaSyBA1clTuoA4xzkQaqYdmLlM5VDVQeue8sE";
    var key = "AIzaSyBqzAaUsP-A6pacaRpQwBdD0Lk-m2wXs04";
    var url = baseUrl + "?key=" + key + "&location=" + lat + ","+ long + "&radius=" + radius + "&type=" + type;

    var options = { method: 'GET',
      url: url,
      headers: { 'content-type': 'application/json' },
      json: true
    };

    request(options, function (error, response, body) {
        if (error){
            return cb(error);
        }
        var listOfPlaces = [];
        var results = response.body.results;
        for (var i=0; i<results.length; i++){
          var result = {};
          result.name = results[i].name;
          result.lat = results[i].geometry.location.lat;
          result.long = results[i].geometry.location.lng;
          result.type = type;
          result.weather = {weather : "Cloudy", temperature : 15, wind:{dir:"N",v:10}};
          listOfPlaces.push(result);
        }
        cb(null, listOfPlaces);
    });
  };
}

router.get('/getPlaces', function (req, res, next) {
    var options = { method: 'GET',
    url: 'https://qlb5gy2eu5.execute-api.eu-west-1.amazonaws.com/prod/print-list',
    headers: { 'content-type': 'application/json' },
    json: true };

    request(options, function (error, response, body) {
        if (error){
            throw new Error(error);
        }
        res.json(response);
    });
});


router.get('/getGround', function (req, res, next) {
    var lat = req.param('lat');
    var long = req.param('long');
    var radius = req.param('radius');
    asyncTasks = [
      listOfPlaces(lat, long, radius, "airport"),
      listOfPlaces(lat, long, radius, "stadium"),
      listOfPlaces(lat, long, radius, "amusement_park")
    ];
    listToReturn = [];
    async.parallel(asyncTasks, function(err, results){
      res.json(Array.prototype.concat.apply([], results));
    });
});



// http://localhost:8081/api/getAirports?lat=50.727622&long=-3.475646&radius=50000
router.get('/getAirports', function (req, res, next) {
    var lat = req.param('lat');
    var long = req.param('long');
    var radius = req.param('radius');
    var baseUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
    //var key = "AIzaSyBA1clTuoA4xzkQaqYdmLlM5VDVQeue8sE";
    var key = "AIzaSyBqzAaUsP-A6pacaRpQwBdD0Lk-m2wXs04";
    var url = baseUrl + "?key=" + key + "&location=" + lat + ","+ long + "&radius=" + radius + "&types=stadium,airport,place_of_worship";

    var options = { method: 'GET',
      url: url,
      headers: { 'content-type': 'application/json' },
      json: true
    };

    request(options, function (error, response, body) {
        if (error){
            throw new Error(error);
        }
        var listOfPlaces = [];
        var results = response.body.results;
        for (var i=0; i<results.length; i++){
          var result = {};
          result.type = "airport";
          result.name = results[i].name;
          result.lat = results[i].geometry.location.lat;
          result.long = results[i].geometry.location.lng;
          result.weather = {weather : "Cloudy", temperature : 15, wind:{dir:"N",v:10}};
          listOfPlaces.push(result);
        }
        res.json(listOfPlaces);
    });
});

// http://localhost:8081/api/getAirports?lat=50.727622&long=-3.475646&radius=50000
router.get('/getStadia', function (req, res, next) {
    var lat = req.param('lat');
    var long = req.param('long');
    var radius = req.param('radius');
    var baseUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
    var key = "AIzaSyBqzAaUsP-A6pacaRpQwBdD0Lk-m2wXs04";
    var url = baseUrl + "?key=" + key + "&location=" + lat + ","+ long + "&radius=" + radius + "&type=stadium";

    var options = { method: 'GET',
      url: url,
      headers: { 'content-type': 'application/json' },
      json: true
    };

    request(options, function (error, response, body) {
      console.log(response);
        if (error){
          throw new Error(error);
        }
        var listOfPlaces = [];
        var results = response.body.results;
        for (var i=0; i<results.length; i++){
          var result = {};
          result.type = "stadium";
          result.name = results[i].name;
          result.lat = results[i].geometry.location.lat;
          result.long = results[i].geometry.location.lng;
          result.weather = {weather : "Cloudy", temperature : 15, wind:{dir:"N",v:10}};
          listOfPlaces.push(result);
        }
        res.json(listOfPlaces);
    });
});

// http://localhost:8081/api/getWeather?lat=50.727622&long=-3.475646
router.get('/getWeather', function (req, res, next) {
    var lat = req.param('lat');
    var long = req.param('long');
    var basePath = "http://api.openweathermap.org/data/2.5/weather?";
    var key = "6913f2bc71fcb8d4796095c8a6037154";
    var url = basePath + "lat=" + lat + "&lon=" + long + "&APPID=" + key;

    var options = { method: 'GET',
      url: url,
      headers: { 'content-type': 'application/json' },
      json: true
    };

    request(options, function (error, response, body) {
        if (error)
            throw new Error(error);
            var result = response.body;
            var weatherObj = {};
            weatherObj.weather = result.weather[0].main;
            weatherObj.temperature = result.main.temp - 273;
            weatherObj.wind = result.wind;
            weatherObj.visibility = result.visibility;
            weatherObj.pressure = result.pressure;
        res.json(weatherObj);
    });
});
//https://planefinder.net/endpoints/update.php?callback=planeDataCallback&faa=1&routetype=iata&cfCache=true&bounds=50%2C-6%2C52%2C-1&_=1493512540
router.get('/getPlanes', function (req, res, next) {
    var lat = req.param('lat');
    var long = req.param('long');
    var basePath = "https://planefinder.net/endpoints/update.php?faa=1&routetype=iata&cfCache=true&";
    var key = "6913f2bc71fcb8d4796095c8a6037154";
    var url = basePath + "bounds=" + (lat-10) + "," + (long-10) + "," + (lat+10) + "," + (long+10) + "&_=149351254";

    var options = { method: 'GET',
      url: url,
      headers: { 'content-type': 'application/json' },
      json: true
    };

    request(options, function (error, response, body) {
        if (error){
            throw new Error(error);
          }
          var results = response.body.planes["0"];
          var planes = [];
          for (var key in results){
            flight = {};
            flight.planeModel = results[key][0];
            flight.planeNumber = results[key][1];
            flight.flightNumber = results[key][2];
            flight.lat = results[key][3];
            flight.long = results[key][4];
            flight.altitude = results[key][5];
            flight.heading = results[key][6];
            flight.airspeed = results[key][7];
            flight.route = results[key][11];
            planes.push(flight);
          }
        res.json(planes);
    });
});

    router.get('/getInfoFromLatLong', function(req, res, next){
        //http://api.opencagedata.com/geocode/v1/json?q=50.123+-3.78&key=79ff7aef60f15ca75b348ae0bafad9d5
        var lat = req.param('lat');
        var long = req.param('long');
        var basePath = "http://api.opencagedata.com/geocode/v1/json";
        var key = "79ff7aef60f15ca75b348ae0bafad9d5";
        var url = basePath + "?q=" + lat + "+" + long + "&key=" + key;

        var options = { method: 'GET',
            url: url,
            headers: { 'content-type': 'application/json' },
            json: true
        };

        request(options, function (error, response, body) {
            if (error){
                throw new Error(error);
            }
            var results = response.body;
            res.json(results);
        });
    });


module.exports = router;
