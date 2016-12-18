"use strict";

var restify = require("restify");
var http = require('http');

var PORT = (process.env.PORT || 5000);
var TAG_START = "##START";
var TAG_END   = "##END";

var server = restify.createServer();
server.get('/info/:user_id', HandleInfoRequest);
server.listen(PORT, function() {
  console.log('%s listening at %s', server.name, server.url);
});

function HandleInfoRequest(_req, _res, _next) {
  try {
    var userID = _req.params.user_id;
    if (userID) {


      var url = "http://api.opendota.com/api/players/" + userID + "/wl";
      http.get(url, function(res) {
        if (res.statusCode != 200) {
          SendError(_res);
        }
        else {
          var rawData = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => rawData += chunk);
          res.on('end', function() {
            var parsedData = JSON.parse(rawData);

            var text = TAG_START + '\n';
            text += CreateTextToSend(parsedData) + '\n';
            text += TAG_END;

            _res.setHeader('Content-Type', 'text/plain');
            //_res.setHeader('Connection', 'keep-alive');
            //_res.write(userID, "utf-8");
            _res.write(text);
            console.log("SENDING...");
            _res.end(function() {
              console.log("SENDING IS OVER");
            });
          });
        }
      });
    }
  }
  catch (e) {
    console.error(e);
    SendError(_res);
  }
}

function SendError(_res) {
  _res.setHeader('Content-Type', 'text/plain');
  _res.write("Error...", "utf-8");
  console.error("SENDING...");
  _res.end(function() {
    console.error("SENDING IS OVER");
  });
}

function CreateTextToSend(_data) {
  var text = "W/L: " + _data.win + "/" + _data.lose + '\n';

  return text;
}
