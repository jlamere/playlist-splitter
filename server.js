// set up 
var express = require('express');
var app = express();                        
var port = process.env.PORT || 8080;                
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var SpotifyWebApi = require('spotify-web-api-node');
var credentials = require('./credentials.json');
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
var spotifyApi = new SpotifyWebApi(credentials);
console.log("Connected to the spotify API");

var accessTokenPromise = spotifyApi.clientCredentialsGrant()
var getTracksPromise = function(username, playlist_id){
    return spotifyApi.getPlaylistTracks(username, playlist_id, { 'offset' : 0,  'fields' : 'items' }) 
}

app.get('/track_data', function(req, res){
    var data = accessTokenPromise
        // get an access token 
        .then(function(data){
            spotifyApi.setAccessToken(data.body['access_token']);
            console.log("access token assigned")
            return getTracksPromise('12819242', '1d2HqfSDIpNA3Gb6WfPHMs')             
        })
        // playlist tracks -> track ids
        .then(function(data){
            return data.body.items.map(function(t) {return t.track.id; });
        })
        .then(function(trackIds){
            trackDataPromises = [];
            trackIds.forEach(function(id){
                trackDataPromises.push(spotifyApi.getAudioFeaturesForTrack(id));
            })
            Promise.all(trackDataPromises)
                .then(function(data){
                    res.json(data);
                })
        })
});