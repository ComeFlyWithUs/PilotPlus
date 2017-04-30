(function(){
  "use strict";
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
  });/*
  viewer.scene.globe.enableLighting = true;
  viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
    url : 'https://assets.agi.com/stk-terrain/world',
    requestVertexNormals : true
  });
  viewer.scene.globe.depthTestAgainstTerrain = true;
*/
  viewer.scene.screenSpaceCameraController.enableRotate = true;
  viewer.scene.screenSpaceCameraController.enableTranslate = true;
  viewer.scene.screenSpaceCameraController.enableZoom = true;
  viewer.scene.screenSpaceCameraController.enableTilt = true;
  viewer.scene.screenSpaceCameraController.enableLook = true;


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

      

      // Gets position of our screen - might be useful
      // var lastTime = Cesium.getTimestamp();
      // var lastPosition = viewer.scene.camera.position.clone();

      // function preRender(scene) {
      //     var time = Cesium.getTimestamp();
      //     var position = scene.camera.position;
      //     if (!Cesium.Cartesian3.equalsEpsilon(lastPosition, position, Cesium.Math.EPSILON4)) {
      //         lastTime = time;
      //     }

      //     lastPosition = position.clone();
      // }

      // viewer.scene.preRender.addEventListener(preRender);

      // function makeDegrees(lat, long, alt){
      //     var result = Cesium.Cartesian3.fromDegrees(lat, long, alt);
      //     console.log("Result: " + result);
      // }
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
        if(viewerTarget){
          viewer.entities.remove(viewerTarget);
        }
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

        getNearbyStuff(center);

  // var eastToCenter = rectangle.east - center.longitude;
        // var northToCenter = rectangle.north - center.latitude;

        // var northSouthVal = northToCenter * 0.2;
        // var northVal = center.latitude + northSouthVal;
        // var southVal = center.latitude - northSouthVal;

        // var eastWestVal = eastToCenter * 0.2;
        // var eastVal = center.longitude + eastWestVal;
        // var westVal = center.longitude - eastWestVal;

        // console.log("west: ", westVal, " south: ", southVal, " east: ", eastVal, " north: ", northVal);
        // if(viewerTarget != null){
        //   viewer.entities.remove(viewerTarget);
        // }

      });

      var locations = null;

      function getNearbyStuff(center){
        var latLong = Cesium.Cartographic.fromCartesian(center);
        console.log(latLong);

        var obj = {};
        obj.lat = latLong.latitude * (180.0 / Math.PI);
        obj.long = latLong.longitude * (180.0 / Math.PI);
        obj.radius = 50000;

        $.ajax({
          url: '/api/getAirports',
          type: 'GET',
          data: obj,
          dataType: 'json',
          success: function(data) {
            var airports = data;

            for (var i=0;i<airports.length;i++){
              var pinBuilder = new Cesium.PinBuilder();
              console.log("Placing airport pin at", Cesium.Cartesian3.fromDegrees(airports[i].lat, airports[i].long));
              viewer.entities.add({
                  name : airports[i].name,
                  position : Cesium.Cartesian3.fromDegrees(airports[i].long, airports[i].lat),
                  description: "Forecast: " + airports[i].weather.weather + 
                    "<br>Temperature: " + airports[i].weather.temperature + 
                    "<br>Wind Speed: " + airports[i].weather.wind.v +
                    "<br>Wind Direction: " + airports[i].weather.wind.dir,
                  billboard : {
                      image : pinBuilder.fromColor(Cesium.Color.ROYALBLUE, 48).toDataURL(),
                      verticalOrigin : Cesium.VerticalOrigin.BOTTOM
                  },
                  label : {
                      text : airports[i].name + 
                            "\nForecast: " + airports[i].weather.weather + 
                            "\nTemperature: " + airports[i].weather.temperature + 
                            "\nWind Speed: " + airports[i].weather.wind.v +
                            "\nWind Direction: " + airports[i].weather.wind.dir,
                      font : '12pt monospace',
                      //style: Cesium.LabelStyle.OUTLINE,
                      //outlineWidth : 2,
                      verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
                      pixelOffset : new Cesium.Cartesian2(0, -9)
                    }
              });
            }
          },
          error: function(error) { console.log(error); }
      });
      }
    }());
}());
