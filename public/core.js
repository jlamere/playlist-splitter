var playlistSplitter = angular.module('playlistSplitter', [])


function mainController($scope, $http,$window){
    $scope.authenticate = function(){
        $http.get('/login')
            .success((data) => {
                // some how gets an extra pair of quotes
                const returnUri = data.replace('"', '');
                $window.location.href = returnUri;
            })
    }

    $scope.split = function(){
        $http.get('/split?user_id=12819242&playlist=1d2HqfSDIpNA3Gb6WfPHMs')
    }
}