angular.
  module('playlistSplitter').
  config(['$locationProvider', '$routeProvider',
    function config($locationProvider, $routeProvider) {
      //$locationProvider.hashPrefix('!');
    $locationProvider.html5Mode(true);

      $routeProvider.
        when('/select', {
          template: "<select-playlist></select-playlist>"
        }).
        when('/auth', {
          template: '<login></login>'
        }).
        when('/callback/?', {
          template: '<callback></callback>'
        }).
        otherwise('/');
    }
  ]);