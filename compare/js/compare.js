var compareApp = angular.module('compareApp', ['ngRoute']);


compareApp.config( function( $routeProvider ){
  $routeProvider
    .when( "/compare", {redirect:'/url'} )
    .when( "/url", {action: 'url'} )
    .when( "/file", {action:'file'} )
    .otherwise( {action: "file"} );
});


compareApp.controller('MainCtrl', function ($scope, $route, $routeParams, $q, $http, $filter, $timeout) {

  var resembleTestConfig = {
    errorColor: {red: 255, green: 0, blue: 255},
    errorType: 'movement',
    transparency: 0.1,
    largeImageThreshold: 1200
  };

  var defaultMisMatchThreshold = 1;

  //A TEST PAIR ARE TWO IMAGE OBJECTS PLUS THEIR META DATA WHICH WILL BE COMPARED BY RESEMBLE
  var reset = function() {
    $scope.currentTestPairs = [];
    $scope.currentTestPairsCompleted = 0;
    $scope.passedCount = 0;
    $scope.testDuration = 0;
    $scope.testIsRunning = false;
  }

  reset();


  $scope.detailFilterOptions = ['failed','passed','all','none'];
  $scope.statusFilter = 'none';

  $scope.displayOnStatusFilter = function(o){
    if(o.processing)return false;
    //console.log($scope.statusFilter,o)
    if($scope.statusFilter=='all'){
      return true;
    }else if($scope.statusFilter=='failed'){
      if(!o.passed){return true;}
    }else if($scope.statusFilter=='passed'){
      if(o.passed){return true;}
    }else{
      return false;
    }
  };


  var testPairObj = function(a,b,c,o){
    this.a={src:a||'',srcClass:'reference'},
    this.b={src:b||'',srcClass:'test'},
    this.c={src:c||'',srcClass:'diff'},
    this.report=null;
    this.processing=true;
    this.passed=false;
    this.meta = o;
    this.meta.misMatchThreshold = (o && o.misMatchThreshold && o.misMatchThreshold >= 0) ? o.misMatchThreshold : defaultMisMatchThreshold;
  };

  $scope.$on("$routeChangeSuccess", function( $currentRoute, $previousRoute ){
    $scope.params = JSON.stringify($routeParams,null,2);
    $scope.action = $route.current.action;

    if($scope.action=='url')
      $scope.runUrlConfig($routeParams);
    else
      $scope.runPastFilesConfig($routeParams);


  });


  //TAKES PARAMETERS FROM URL AND RUNS IMG DIFF TEST
  $scope.runUrlConfig = function(params){
    console.log(params);
    $scope.currentTestPairs.push(new testPairObj('../'+params.a, '../'+params.b, null));
    $scope.compareTestPair($scope.currentTestPairs[0]);
  };


  //READS CONFIG FROM PAST TESTS DATE FILE
  $scope.runPastFilesConfig = function(params){
    $http.get('./past_tests.json')
      .success(function(data, status) {
        console.log('got past test dates!',status,data);
        $scope.pastDates = data.dates;
        $scope.currentTargetDate = data.dates[data.dates.length - 1]; // latest date
        $scope.runFileConfig($scope.currentTargetDate);
      })
      .error(function(data, status) {
        console.log('config file operation failed '+status);
      });
  };


  // RUNS IMG DIFF TEST
  $scope.runFileConfig = function(captureDate) {
    $scope.testIsRunning = true;
    $http.get('./config-' + captureDate + '.json')
      .success(function(data, status) {
        console.log('got data!',status,data,captureDate);
        data.testPairs.forEach(function(o,i,a){
          $scope.currentTestPairs.push(new testPairObj('../'+o.local_reference, '../'+o.local_test, null, o));
        });
        $scope.compareTestPairs($scope.currentTestPairs);

      })
      .error(function(data, status) {
        console.log('config file operation failed '+status);
      });
  };



  //LOOPS THROUGH TEST PAIR CONFIG AND CALLS compareTestPair(testPair) ON EACH ONE
  $scope.compareTestPairs = function compareTestPairs(testPairs){
    var startTs = new Date();

    async.eachLimit(
      testPairs
      ,1
      ,function(testPair,cb){
        $scope.compareTestPair(testPair,function(o){
          if(o.passed)$scope.passedCount++;
          $scope.currentTestPairsCompleted++;
          $scope.testDuration = (new Date()-startTs);
          $timeout(function() {
            cb();
          }, 0);
        });
      }
      ,function(){
        $scope.testIsRunning = false;
        if($scope.passedCount == $scope.currentTestPairsCompleted)
          $scope.statusFilter='passed';
        else
          $scope.statusFilter='failed';
        $scope.$digest();
      }
    );

  };



  //TEST AN INDIVIDUAL testPair OBJECT.  UPDATES THE OBJECT WITH RESULTS AND THEN RETURNS THE OBJECT WITH THE CALLBACK
  $scope.compareTestPair = function compareTestPair(testPair,cb){
    testPair.processing=true;

    resemble.outputSettings(resembleTestConfig);

    var diff = resemble(testPair.a.src).compareTo(testPair.b.src).onComplete(function(diffData){
      testPair.report = JSON.stringify(diffData,null,2);
      testPair.c.src = diffData.getImageDataUrl();
      testPair.processing=false;
      testPair.passed=(diffData.isSameDimensions && diffData.misMatchPercentage<testPair.meta.misMatchThreshold)?true:false;
      if(cb)cb(testPair);
    });
  };//scope.compareTestPair()


  //CHANGE TEST DATA
  $scope.changeTarget = function changeTarget() {
    reset();
    $scope.runFileConfig($scope.currentTargetDate);
  }


});
