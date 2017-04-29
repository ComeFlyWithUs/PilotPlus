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
      //infoBox: false
      animation: false
  });
  viewer.scene.globe.enableLighting = true;
  viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
    url : 'https://assets.agi.com/stk-terrain/world',
    requestVertexNormals : true
  });
  viewer.scene.globe.depthTestAgainstTerrain = true;

  var lat = 50.7215586;
  var long = -3.4624745;
  var altitude = 10000;

  viewer.camera.setView({
    destination : Cesium.Cartesian3.fromDegrees(long, lat, altitude),
    orientation: {
      heading : 0,
      pitch : -Math.PI / 2,
      roll : 0
    }
  });


}());
