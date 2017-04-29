var express = require("express");
var app = express();

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

app.use(express.static("static"));
app.use("/lib", express.static("node_modules/cesium/Build"));

app.listen(normalizePort(process.env.PORT || '8080'));
