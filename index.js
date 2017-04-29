var express = require("express");
var app = express();

app.use(express.static("static"));
app.use("/lib", express.static("node_modules/cesium/Build"));

app.listen(8080);
