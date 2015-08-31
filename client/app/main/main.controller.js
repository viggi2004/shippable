'use strict';

angular.module('shippableApp')
  .controller('MainCtrl', function ($scope, $http) {
    
    $('#submit').on('click',function(event){
      $scope.fetchedDetails = false;
      var repositoryname = $('#repo').val();
      $http.get('api/things/getissues?repo='+encodeURIComponent(repositoryname)).success(function(json) {
        console.log(json);
        $scope.issuedetails   = json;
        $scope.fetchedDetails = true;
        delete $scope.error;

      }).error(function(err){
         $scope.error = err;
      });

    });
    
  });
