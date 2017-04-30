(function(){
  "use strict";
  Cesium.BingMapsApi.defaultKey = "AnD6fuC04ElaloYXDwvfUzJXS-Gq5wBrgeFEXtE0cSuukTFEeTufzYdLUEM49ZcF";
  var viewer = new Cesium.Viewer('cesiumContainer', {
      vrButton : true,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      selectionIndicator: false,
      navigationInstructionsInitiallyVisible: false,
      animation: false
  });
/*
  viewer.scene.globe.enableLighting = true;
  viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
    url : 'https://assets.agi.com/stk-terrain/world',
    requestVertexNormals : true
  });
  viewer.scene.globe.depthTestAgainstTerrain = true;
*/
  viewer.scene.screenSpaceCameraController.enableRotate = false;
  viewer.scene.screenSpaceCameraController.enableTranslate = false;
  viewer.scene.screenSpaceCameraController.enableZoom = false;
  viewer.scene.screenSpaceCameraController.enableTilt = false;
  viewer.scene.screenSpaceCameraController.enableLook = true;

  var typeMap = {
    "airport": new Cesium.Color(0, 0.627, 0.862, 1),
    "stadium": new Cesium.Color(0.553, 0.423, 0.67, 1),
    "amusement_park": new Cesium.Color(0.867, 0.317, 0.263, 1),
    "transit_station": new Cesium.Color(0.902, 0.522, 0.137, 1),
    "university": new Cesium.Color(0, 0.682, 0.702, 1),
    "museum": new Cesium.Color(0.929, 0.698, 0.125, 1),
    "city_hall": new Cesium.Color(0.863, 0.294, 0.537, 1),
    "default": new Cesium.Color(0, 0, 0, 1)
  };

  (function(){
    //Camera Control
    var lat = 50.7215586;
    var long = -3.4624745;
    var altitude = 10000;

    var lastNode = null;
    var currentFlightNode = 0;
    var flightData = {
      points: []
    };
    var currentFlight = null;

    var lastFrameTs = null;
    function frameMoveCamera(ts){
      if(!lastFrameTs){
        lastFrameTs = ts;
        Cesium.requestAnimationFrame(frameMoveCamera);
        return;
      }

      var deltaT = ts - lastFrameTs;
      lastFrameTs = ts;
      currentFlight.timeLeft -= deltaT;
      viewer.camera.move(currentFlight.direction, currentFlight.distance * (deltaT / currentFlight.time));
      viewer.camera.percentageChanged = 0.25;
      if(currentFlight.timeLeft <= 0){
        executeNextFlightNode();
      }else{
        Cesium.requestAnimationFrame(frameMoveCamera);
      }
    }

    function executeNextFlightNode(){
      currentFlightNode = (currentFlightNode + 1) % flightData.points.length;
      var node = flightData.points[currentFlightNode];
      var currentPos = Cesium.Cartesian3.fromDegrees(lastNode.long, lastNode.lat, lastNode.alt);
      var targetPos = Cesium.Cartesian3.fromDegrees(node.long, node.lat, node.alt);

      var direction = Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(targetPos, currentPos, new Cesium.Cartesian3()), new Cesium.Cartesian3());
      var distance = Cesium.Cartesian3.distance(targetPos, currentPos);
      currentFlight = {
        start: currentPos,
        end: targetPos,
        direction: direction,
        distance: distance,
        time: node.t * 1000,
        timeLeft: node.t * 1000
      };
      lastNode = node;
      Cesium.requestAnimationFrame(frameMoveCamera);
    }
    $.get("demo-flight.json", function(data){
      flightData = data;
      var node = flightData.points[0];
      lastNode = node;
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(node.long, node.lat, node.alt),
        orientation: {
          heading : 0,
          pitch : 0,
          roll : 0
        }
      });
      executeNextFlightNode();
    });

      var lastPinBatch = {};
      var viewerTarget = null;
      viewer.camera.changed.addEventListener(function(){
        var viewport = $("#cesiumContainer");
        var viewportWidth = viewport.width();
        var viewportHeight = viewport.height();

        var ray = viewer.camera.getPickRay(new Cesium.Cartesian2(viewportWidth / 2, viewportHeight / 2));
        var intersection = Cesium.IntersectionTests.rayEllipsoid(ray, Cesium.Ellipsoid.WGS84);
        if(!intersection){
          return;
        }
        var center = Cesium.Ray.getPoint(ray, intersection.start);
        var pinBuilder = new Cesium.PinBuilder();
        //if(viewerTarget){
        //  viewer.entities.remove(viewerTarget);
        //}
        console.log("Posting new pin", center);


        /* PUT A PIN WHERE WE ARE */
        // viewerTarget = viewer.entities.add({
        //     name : "viewport center",
        //     position : center,
        //     billboard : {
        //         image : pinBuilder.fromColor(Cesium.Color.ROYALBLUE, 48).toDataURL(),
        //         verticalOrigin : Cesium.VerticalOrigin.BOTTOM
        //     }
        // });

        /* GOOGLE ANALYTICS ENGINE HAS A QUOTA - WE JUST HIT IT!!*/

        getNearbyAirports(center);
        //getNearbyPlanes(center);
        //getInfoFromLatLong(center);
      });

      var locations = null;
      var airportData = [];
      var lastFetch = 0;
      function renderAirports(data, center) {
        var airports = data;

        lastPinBatch.airports.forEach(function(pin){ viewer.entities.remove(pin); });
        lastPinBatch.airports.splice(0, lastPinBatch.airports.length);

        var closestPoint = findClosestPoint(airports, center);

        for (var i=0;i<airports.length;i++){
          var pinBuilder = new Cesium.PinBuilder();
          //console.log("Placing airport pin at", Cesium.Cartesian3.fromDegrees(airports[i].lat, airports[i].long));
          var pinObj = {
              name : airports[i].name,
              position : Cesium.Cartesian3.fromDegrees(airports[i].long, airports[i].lat),
              description: "Forecast: " + airports[i].weather.weather +
                "<br>Temperature: " + airports[i].weather.temperature +
                "<br>Wind Speed: " + airports[i].weather.wind.v +
                "<br>Wind Direction: " + airports[i].weather.wind.dir,
              billboard : {
                  image : pinBuilder.fromColor(typeMap[airports[i].type] || typeMap.default, 48).toDataURL(),
                  verticalOrigin : Cesium.VerticalOrigin.BOTTOM
              }
          };

          if(airports[i] === closestPoint){
            console.log("Closeest pin is ", airports[i])
            pinObj.label = {
              text : airports[i].name +
                    "\nForecast: " + airports[i].weather.weather +
                    "\nTemperature: " + airports[i].weather.temperature +
                    "\nWind Speed: " + airports[i].weather.wind.v +
                    "\nWind Direction: " + airports[i].weather.wind.dir,
              font : '12pt sans-serif',
              //style: Cesium.LabelStyle.OUTLINE,
              //outlineWidth : 2,
              verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
              pixelOffset : new Cesium.Cartesian2(0, -9)
            };
          }
          var newPin = viewer.entities.add(pinObj);
          lastPinBatch.airports.push(newPin);
        }
      }
      function getNearbyAirports(center){
        lastPinBatch.airports = lastPinBatch.airports || [];

        var latLong = Cesium.Cartographic.fromCartesian(center);
        var obj = {};
        obj.lat = latLong.latitude * (180.0 / Math.PI);
        obj.long = latLong.longitude * (180.0 / Math.PI);
        obj.radius = 10000;
        var now = new Date().getTime();
        if(now - lastFetch > 10000){
          lastFetch = now;
          $.ajax({
            url: '/api/getGround',
            type: 'GET',
            data: obj,
            dataType: 'json',
            success: function(data){
              airportData = data;
              renderAirports(data, center);
            },
            error: function(error) { console.log(error); }
          });
        }else{
          renderAirports(airportData, center);
        }
      }

    // Nearly completed - fix array range error!
    function getNearbyPlanes(center){
      var latLong = Cesium.Cartographic.fromCartesian(center);
      lastPinBatch.planes = lastPinBatch.planes || [];


      var obj = {};
      obj.lat = latLong.latitude * (180.0 / Math.PI);
      obj.long = latLong.longitude * (180.0 / Math.PI);

      $.ajax({
          url: '/api/getPlanes',
          type: 'GET',
          data: obj,
          dataType: 'json',
          success: function(data) {
            var planes = data;

            lastPinBatch.planes.forEach(function(pin){ viewer.entities.remove(pin); });
            lastPinBatch.planes.splice(0, lastPinBatch.planes.length);

            for (var j=0; j<planes.length; j++){
              var pinBuilder = new Cesium.PinBuilder();
              console.log("Placing plane pin at", Cesium.Cartesian3.fromDegrees(planes[j].long, planes[j].lat, planes[j].altitude));
              var newPin = viewer.entities.add({
                  name : planes[j].name,
                  position : Cesium.Cartesian3.fromDegrees(planes[j].long, planes[j].lat, planes[j].altitude),
                  billboard : {
                    image : pinBuilder.fromColor(Cesium.Color.ROYALBLUE, 48).toDataURL(),
                    verticalOrigin : Cesium.VerticalOrigin.BOTTOM
                  },
                  label : {
                      text : planes[j].name,
                      font : '12pt sans-serif',
                      //style: Cesium.LabelStyle.OUTLINE,
                      //outlineWidth : 2,
                      verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
                      pixelOffset : new Cesium.Cartesian2(0, -9)
                    }
              });
              lastPinBatch.planes.push(newPin);
            }
          },
          error: function(error) { console.log(error); }
      });
    }

    function getInfoFromLatLong(center){
      console.log("I'm in");
      var latLong = Cesium.Cartographic.fromCartesian(center);

        var obj = {};
        obj.lat = latLong.latitude * (180.0 / Math.PI);
        obj.long = latLong.longitude * (180.0 / Math.PI);

        $.ajax({
          url: '/api/getInfoFromLatLong',
          type: 'GET',
          data: obj,
          dataType: 'json',
          success: function(data) {
            var info = data;
            console.log(info);
          }, error: function(error) { console.log(error); }
        });
    }

    function findClosestPoint(dataArr, targetPoint){
      var closestPoint = null;
      var closestDistance = Math.min();
      dataArr.forEach(function(point){
        var pointCoord = Cesium.Cartesian3.fromDegrees(point.long, point.lat);
        var distance = Cesium.Cartesian3.distance(pointCoord, targetPoint);
        if(distance < closestDistance){
          closestDistance = distance;
          closestPoint = point;
        }
      });
      return closestPoint;
    }

    }());
}());
