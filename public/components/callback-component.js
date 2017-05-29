angular
    .module('playlistSplitter')
    .component('callback',{
        template:'',
        controller: function($location, $cookies){
            console.log("here")
            let url = $location.url()
            if(url.indexOf("code") > -1){
              let token = url.split('=')[1].split('&')[0]
              $cookies.put("accessToken", token)
              $location.path('/select')
            }
            // todo error handling else
        }
    });