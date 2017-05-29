// set up 
let express = require('express');
let app = express();                        
let port = process.env.PORT || 8080;                
let morgan = require('morgan');
let bodyParser = require('body-parser');
let methodOverride = require('method-override');
let SpotifyWebApi = require('spotify-web-api-node');
let credentials = require('./credentials.json');

// config
app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());




let usedAttributes = ["danceability", "energy", "acousticness", "instrumentalness","liveness", "mode"]


app.get('/split', (req, res) => {
    const user_id = req.query['user_id'];
    const playlist_id = req.query["playlist"];
    let data = accessTokenPromise
        // get an access token 
        .then((data) => {
            spotifyApi.setAccessToken(data.body['access_token']);
            console.log("access token assigned")
            return getTracksPromise(user_id, playlist_id)             
        })
        // playlist tracks -> track ids
        .then(data => data.body.items.map((t) => {return t.track.id; }))
        
        .then((trackIds) =>{
            trackDataPromises = [];
            trackIds.map(t => trackDataPromises.push(spotifyApi.getAudioFeaturesForTrack(t)))
            Promise.all(trackDataPromises)
                .then((data) => {
                    cleanData = data.map((t)=> {return [t.body]; })
                    clusters = agglomerate(cleanData);
                    output = {"description" : descriptor(clusters), 
                              "data"        : clusters}
                    res.json(output)
                    return data
                })
                .then((data) =>{
                    console.log(data)
                    spotifyApi.createPlaylist(user_id, 'My Cool Playlist', { 'public' : true })

                })
        })
})

app.get('/login', function(req, res) {
    let scopes = ['user-read-private','user-modify-private']
    let state = "12345"
    //TODO add state
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
    res.json(authorizeURL);
});

app.get('*', function(req, res) {
        res.sendfile('./public/views/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });

// start up
app.listen(8080);
console.log("App listening on port 8080");

// connect to the spotify api
let spotifyApi = new SpotifyWebApi(credentials);
console.log("Connected to the spotify API");
let accessTokenPromise = spotifyApi.clientCredentialsGrant()
let getTracksPromise = (username, playlist_id) => {
    return spotifyApi.getPlaylistTracks(username, playlist_id, { 'offset' : 0,  'fields' : 'items' }) 
}

let euclideanDistance = (track1, track2) => {
    let distance = 0
    for(let i in track1){
        distance += Math.pow(track1[i] - track2[i], 2)
    }
    return Math.sqrt(distance)
}
let getVector = (tracksData) => {
    let vector = []
    for (let key in tracksData[0]){
        if (usedAttributes.indexOf(key) > -1){
             let sum = 0
             for (let track in tracksData){
                    sum += tracksData[track][key]
             }
            vector.push(sum/tracksData.length)
        }   
    }
    return vector
}
let clusterWithOne = (clusters) => {
    for(let i in clusters){
        if(clusters[i].length === 1){
            return true
        }
    }
    return false
}
let agglomerate = (clusters) => {
    
    if (clusters.length ===  2){ 
        return clusters
    }

    let minDistance = Number.MAX_VALUE;
    let c1 = 0
    let c2 = 0
    let vectorClusters = []

    clusters.map((c) => {vectorClusters.push(getVector(c))})

    for (let i = 0; i<clusters.length; i++){
        // try to get straggling songs into a cluster
        if(clusterWithOne(clusters) && clusters[i].length !== 1){
            continue
        }
        for(let j = i+1; j<clusters.length; j++){
            let e = euclideanDistance(vectorClusters[i],vectorClusters[j])
            if(e < minDistance){
                minDistance = e
                c1 = i
                c2 = j
            }
        }
    }
    // merge the two clusters
    c2Extracted = clusters[c2]
    clusters.splice(c2, 1)
    clusters[c1] = clusters[c1].concat(c2Extracted)
    return agglomerate(clusters)
}
let descriptor = (clusters) =>{
    let v1 = getVector(clusters[0])
    let v2 = getVector(clusters[1])
    let output = "Playlist 1 is ";

    for (let v in v1){
        let keyword = v1[v] > v1[v] ? "more " : "less "
        output += keyword + usedAttributes[v] + ","
    }
    return output += "than playlist 2"
}
