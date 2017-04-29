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

  viewer.scene.screenSpaceCameraController.enableRotate = false;
  viewer.scene.screenSpaceCameraController.enableTranslate = false;
  viewer.scene.screenSpaceCameraController.enableZoom = false;
  viewer.scene.screenSpaceCameraController.enableTilt = false;
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
      /*
      viewer.camera.flyTo({
        duration: node.t,
        destination: Cesium.Cartesian3.fromDegrees(node.long, node.lat, node.alt),
        complete: executeNextFlightNode,
        orientation: {
          heading : 0,
          pitch : 0,
          roll : 0
        },
        maximumHeight: Math.min(node.alt, lastNode.alt)
      });*/
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
          pitch : -Math.PI / 10,
          roll : 0
        }
      });
      executeNextFlightNode();

    });

  }());
}());
