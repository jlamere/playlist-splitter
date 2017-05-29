angular
    .module('playlistSplitter')
    .component('login',{
        templateUrl: './views/login.html',
        controller: function LoginController($scope, $http, $window, $cookies,$location){
            if($cookies.get("accessToken")){
                $location.path('/select')
            }
            $scope.authenticate = function(){
                $http.get('/login')
                    .success((data) => {
                        // some how gets an extra pair of quotes
                        const returnUri = data.replace('"', '');
                        $window.location.href = returnUri;
                        
                    })
                }
            }
        });
