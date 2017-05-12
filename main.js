"use strict";

var restify = require("restify");
var https = require('https');

var PORT = (process.env.PORT || 5000);
var TAG_START = "##START";
var TAG_END   = "##END";

var NB_HEROES_TO_PARSE = 1;

var HEROES = {};
GetHeroesInformation();

var server = restify.createServer();
server.get('/info/:user_id', HandleInfoRequest);
server.listen(PORT, function() {
    console.log('%s listening at %s', server.name, server.url);
});

function HandleInfoRequest(_req, _res, _next) {
    try {
        // if we don't have heroes information
        if (HEROES.length == 0) {
            // get them
            GetHeroesInformation();
        }

        var localData = {};
        var userID = _req.params.user_id;
        if (userID) {
            GetWinLose(userID, function(error, data) {
                if (error) {
                    SendError(_res);
                }
                else {
                    localData.win = data.win;
                    localData.lose = data.lose;

                    GetHeroes(userID, function(error, data) {
                        localData.heroes = data.heroes;

                        var text = TAG_START + '\n';
                        text += CreateTextToSend(localData) + '\n';
                        text += TAG_END;

                        _res.setHeader('Content-Type', 'text/plain');
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

function GetWinLose(_userID, _callback) {
    var url = "https://api.opendota.com/api/players/" + _userID + "/wl";
    https.get(url, function(res) {
        if (res.statusCode != 200) {
            _callback("Error", null);
        }
        else {
            var rawData = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => rawData += chunk);
            res.on('end', function() {
                var parsedData = JSON.parse(rawData);

                var data = {
                    win: parsedData.win,
                    lose: parsedData.lose
                };

                _callback(null, data);
            });
        }
    });
}

function GetHeroes(_userID, _callback) {
    var url = "https://api.opendota.com/api/players/" + _userID + "/heroes";
    https.get(url, function(res) {
        if (res.statusCode != 200) {
            _callback("Error", null);
        }
        else {
            var rawData = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => rawData += chunk);
            res.on('end', function() {
                var parsedData = JSON.parse(rawData);

                var heroes = [];
                for (var i=0; i<NB_HEROES_TO_PARSE; ++i) {
                    var hero = parsedData[i];
                    heroes.push({
                        hero_id: hero.hero_id,
                        games: hero.games,
                        win: hero.win
                    });
                }

                var data = {
                    heroes: heroes
                };

                _callback(null, data);
            });
        }
    });
}

function GetHeroesInformation() {
    var url = "https://api.opendota.com/api/heroes";
    https.get(url, function(res) {
        if (res.statusCode != 200) {
            console.log("No information on heroes.");
        }
        else {
            var rawData = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => rawData += chunk);
            res.on('end', function() {
                var parsedData = JSON.parse(rawData);

                HEROES = {};
                var nbHeroes = parsedData.length;
                for (var i=0; i<nbHeroes; ++i) {
                    var hero = parsedData[i];
                    HEROES[hero.id] = hero;
                }
            });
        }
    });
}

function CreateTextToSend(_data) {
    /*
    var text = "W/L: " + _data.win + "/" + _data.lose + '\n';
    text += "===\n";

    var nbHeroes = _data.heroes.length;
    for (var i=0; i<nbHeroes; ++i) {
        var hero = _data.heroes[i];

        var name = HEROES[hero.hero_id].localized_name;
        var lose = hero.games - hero.win;
        var ratio = Math.floor((hero.win / hero.games) * 100);
        text += name + ":\n"
        text += hero.games + " Games\n";
        text += "W/L: " + hero.win + '/' + lose + "\n";
        text += "Ratio: " + ratio + "%\n";
    }
    */

    var text = _data.win;

    return text;
}
