// set up 
var express = require('express');
var app = express();                        
var port = process.env.PORT || 8080;                
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var SpotifyWebApi = require('spotify-web-api-node');
var credentials = require('./credentials.json');
console.log(credentials);
// config
app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());

// start up
app.listen(8080);
console.log("App listening on port 8080");

// connect to the spotify api

// todo move into a different file
var spotifyApi = new SpotifyWebApi(credentials);
console.log("Connected to the spotify API");


// Get an artist's top tracks
spotifyApi.getArtistTopTracks('0oSGxfWSnnOXhD2fKuz2Gy', 'GB')
  .then(function(data) {
    console.log(data.body);
    }, function(err) {
    console.log('Something went wrong!', err);
  });
