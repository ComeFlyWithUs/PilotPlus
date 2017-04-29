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
  });
  viewer.scene.globe.enableLighting = true;
  viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
    url : 'https://assets.agi.com/stk-terrain/world',
    requestVertexNormals : true
  });
  viewer.scene.globe.depthTestAgainstTerrain = true;

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
    });

      //executeNextFlightNode();

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

      viewer.camera.changed.addEventListener(function(){
        var rectangle = viewer.camera.computeViewRectangle();
        var center = Cesium.Rectangle.center(rectangle);

        var eastToCenter = rectangle.east - center.long;
        var northToCenter = rectangle.north - center.lat;

        var northSouthVal = northToCenter * 0.2;
        var northVal = center + northSouthVal;
        var southVal = center - northSouthVal;

        var eastWestVal = eastToCenter * 0.2;
        var eastVal = center + eastWestVal;
        var westVal = center - eastWestVal;

        console.log("west: ", westVal, " south: ", southVal, " east: ", eastVal, " north: ", northVal);

        // viewer.entities.add({
        //   rectangle : {
        //     coordinates : Cesium.Rectangle.fromDegrees(westVal, southVal, eastVal, northVal)
        //   }
        // });
      });

      var locations = null;

      $.ajax({
          url: '/api/getPlaces',
          type: 'GET',
          crossDomain: true,
          success: function(data) { 
            console.log(locations = data.body); 
            for (var key in locations) {
              // skip loop if the property is from prototype
              if (!locations.hasOwnProperty(key)) continue;
              
              var location = locations[key];
              var pinBuilder = new Cesium.PinBuilder();

              var bluePin = viewer.entities.add({
                  name : location.name,
                  position : Cesium.Cartesian3.fromDegrees(location.lat, location.lon),
                  billboard : {
                      image : pinBuilder.fromColor(Cesium.Color.ROYALBLUE, 48).toDataURL(),
                      verticalOrigin : Cesium.VerticalOrigin.BOTTOM
                  }
              });

            }
          },
          error: function(error) { console.log(error); }
      });
    }());
}());
