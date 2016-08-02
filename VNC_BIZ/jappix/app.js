var http = require('http');
var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');
var serve = serveStatic("./");
http.createServer(function (req, res) {
  var done = finalhandler(req, res);
  serve(req, res, done);
}).listen(8124, '127.0.0.1');
console.log('Server running at http://127.0.0.1:8124');