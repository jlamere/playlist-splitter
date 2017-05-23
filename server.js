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
var usedAttributes = ["danceability", "energy", "acousticness", "instrumentalness","liveness", "mode"]

var getTracksPromise = function(username, playlist_id){
    return spotifyApi.getPlaylistTracks(username, playlist_id, { 'offset' : 0,  'fields' : 'items' }) 
}

var euclideanDistance = function(track1, track2){
    distance = 0;
    for(var i in track1){
        distance += Math.pow(track1[i] - track2[i], 2);
    }
    return Math.sqrt(distance);
}
var getVector = function(tracksData){
    vector = []
    for (var key in tracksData[0]){
        if (usedAttributes.indexOf(key) > -1){
             sum = 0;
             for (var track in tracksData){
                    sum += tracksData[track][key]
             }
            vector.push(sum/tracksData.length)
        }   
    }
    return vector
}
var clusterWithOne = function(clusters){
    for(var i in clusters){
        if(clusters[i].length == 1){
            return true;
        }
    }
    return false;
}
var agglomerate = function(clusters){
    if (clusters.length ==  2){ 
        return clusters;
    }

    minDistance = Number.MAX_VALUE;
    var c1 = 0
    var c2 = 0;
    vectorClusters = []
    clusters.map(function(c) {vectorClusters.push(getVector(c))});

    for (var i = 0; i<clusters.length; i++){
        // try to get straggling songs into a cluster
        if(clusterWithOne(clusters) && clusters[i].length != 1){
            continue;
        }
        for(var j = i+1; j<clusters.length; j++){
            var e = euclideanDistance(vectorClusters[i],vectorClusters[j])
            if(e < minDistance){
                minDistance = e;
                c1 = i;
                c2 = j;
            }
        }
    }
    // merge the two clusters
    c2Extracted = clusters[c2];
    clusters.splice(c2, 1);
    clusters[c1] = clusters[c1].concat(c2Extracted);
    return agglomerate(clusters);
}
var descriptor = function(clusters){
    v1 = getVector(clusters[0]);
    v2 = getVector(clusters[1]);

    var output = "Playlist 1 is ";

    for (var v in v1){
        var keyword = v1[v] > v1[v] ? "more " : "less "
        output += keyword + usedAttributes[v] + ","
    }
    return output += "than playlist 2"
}
app.get('/track_data', function(req, res){
    var user_id = req.query['user_id'];
    var playlist_id = req.query["playlist"];
    var data = accessTokenPromise
        // get an access token 
        .then(function(data){
            spotifyApi.setAccessToken(data.body['access_token']);
            console.log("access token assigned")
            return getTracksPromise(user_id, playlist_id)             
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
                    cleanData = data.map(function(t) {return [t.body]; });
                    clusters = agglomerate(cleanData);
                    output = {"description" : descriptor(clusters), 
                              "data"        : clusters}
                    res.json(output);
                })
        })
});

