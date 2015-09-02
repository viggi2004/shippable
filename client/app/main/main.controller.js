'use strict';

angular.module('shippableApp')
  .controller('MainCtrl', function ($scope, $http) {
    
    $('#submit').on('click',function(event){
      console.log(event);
      event.target.disabled = true;

      $scope.fetchedDetails = false;
      var repositoryname = $('#repo').val().trim();
      $http.get('api/getissues?repo='+encodeURIComponent(repositoryname)).success(function(json) {
        console.log(json);
        event.target.disabled = false;
        if(json.error==null)
        {  
          $scope.issuedetails   = json.data;
          $scope.fetchedDetails = true;
          delete $scope.error;
        }
        else
        {
          $scope.error = json.error;
        }
      }).error(function(err){
         $scope.error = err;
      });

    });
    
  });
