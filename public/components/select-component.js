angular
    .module('playlistSplitter')
    .component('selectPlaylist',{
        templateUrl: './views/select-playlist.html',
        controller: function SelectController($scope, $http, $window, $cookies,$location){
            if(!$cookies.get("accessToken")){
                $location.path('/auth')
                }

            }
        });
