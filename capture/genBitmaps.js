var fs = require('fs');

var selectorNotFoundPath = 'capture/resources/selectorNotFound_noun_164558_cc.png'
var hiddenSelectorPath = 'capture/resources/hiddenSelector_noun_63405.png'
var referenceDir = './bitmaps_reference/';
var testDir = './bitmaps_test/';
var genConfigPath = 'capture/config.json'
var
  screenshotNow = new Date(),
  screenshotDateTime = screenshotNow.getFullYear() + pad(screenshotNow.getMonth() + 1) + pad(screenshotNow.getDate()) + '-' + pad(screenshotNow.getHours()) + pad(screenshotNow.getMinutes()) + pad(screenshotNow.getSeconds());


var configJSON = fs.read(genConfigPath);
var config = JSON.parse(configJSON);

if (!config.paths) {
  config.paths = {};
}

var bitmaps_reference = config.paths.bitmaps_reference || 'bitmaps_reference';
var bitmaps_test = config.paths.bitmaps_test || 'bitmaps_test';
var compareConfigFileName = config.paths.compare_data || 'compare/config-' + screenshotDateTime + '.json';
var viewports = config.viewports;
var scenarios = config.scenarios||config.grabConfigs;
var scriptTimeout = config.script_timeout || 20000;


var compareConfig = {testPairs:[]};

var casper = require("casper").create({
  // clientScripts: ["jquery.js"] //lets try not to use this it's 2014 already people...
});

casper.on('resource.received', function(resource) {
    //casper.echo(resource.url);
});

casper.on("page.error", function(msg, trace) {
  // this.echo("Remote Error >    " + msg, "error");
  // this.echo("file:     " + trace[0].file, "WARNING");
  // this.echo("line:     " + trace[0].line, "WARNING");
  // this.echo("function: " + trace[0]["function"], "WARNING");
});

casper.on('remote.message', function(message) {
  this.echo('remote console > ' + message);
});

casper.on('resource.received', function(resource) {
  var status = resource.status;
  if(status >= 400) {
    casper.log('remote error > ' + resource.url + ' failed to load (' + status + ')', 'error');
  }
});



function capturePageSelectors(url,scenarios,viewports,bitmaps_reference,bitmaps_test,isReference,scriptTimeout){

  var consoleBuffer = '';


  casper.on('remote.message', function(message) {
      this.echo(message);
      consoleBuffer = consoleBuffer + '\n' + message;
  });


  casper.start();
  // casper.viewport(1280,1024);



  casper.each(scenarios,function(casper, scenario, scenario_index){

    if (scenario.cookiesJsonFile && fs.isFile(scenario.cookiesJsonFile)) {
      var cookiesJson = fs.read(scenario.cookiesJsonFile);
      var cookies = JSON.parse(cookiesJson);
      for (var i = 0; i < cookies.length; i++) {
        phantom.addCookie(cookies[i]);
      }
    }

    casper.each(viewports, function(casper, vp, viewport_index) {
      this.then(function() {
        this.viewport(vp.width||vp.viewport.width, vp.height||vp.viewport.height);
      });
      this.thenOpen(scenario.url, function() {

        casper.waitFor(
          function(){ //test
            if(!scenario.readyEvent)return true;
            var regExReadyFlag = new RegExp(scenario.readyEvent,'i');
            return consoleBuffer.search(regExReadyFlag)>=0;
          }
          ,function(){//on done
            consoleBuffer = '';
            casper.echo('Ready event received.');
          }
          ,function(){casper.echo('ERROR: casper timeout.')} //on timeout
          ,scriptTimeout
        );
        casper.wait(scenario.delay||1);

      });
      casper.then(function() {
        this.echo('Current location is ' + scenario.url, 'info');

        //var src = this.evaluate(function() {return document.body.outerHTML; });
        //this.echo(src);
      });

      this.then(function(){

        this.echo('Screenshots for ' + vp.name + ' (' + (vp.width||vp.viewport.width) + 'x' + (vp.height||vp.viewport.height) + ')', 'info');

        //HIDE SELECTORS WE WANT TO AVOID
            if ( scenario.hasOwnProperty('hideSelectors') ) {
              scenario.hideSelectors.forEach(function(o,i,a){
                casper.evaluate(function(o){
                  Array.prototype.forEach.call(document.querySelectorAll(o), function(s, j){
                    s.style.visibility='hidden';
                  });
                },o);
              });
            }

        //REMOVE UNWANTED SELECTORS FROM RENDER TREE
            if ( scenario.hasOwnProperty('removeSelectors') ) {
              scenario.removeSelectors.forEach(function(o,i,a){
                casper.evaluate(function(o){
                  Array.prototype.forEach.call(document.querySelectorAll(o), function(s, j){
                    s.style.display='none';
                  });
                },o);
              });
            }

        //CREATE SCREEN SHOTS AND TEST COMPARE CONFIGURATION (CONFIG FILE WILL BE SAVED WHEN THIS PROCESS RETURNS)
            // If no selectors are provided then set the default 'body'
            if ( !scenario.hasOwnProperty('selectors') ) {
              scenario.selectors = [ 'body' ];
            }
        scenario.selectors.forEach(function(o,i,a){
          var cleanedSelectorName = o.replace(/[^a-zA-Z\d]/,'');//remove anything that's not a letter or a number
          //var cleanedUrl = scenario.url.replace(/[^a-zA-Z\d]/,'');//remove anything that's not a letter or a number

          var fileName = cleanedSelectorName + '_';
          // Use scene of scenario
          if ( scenario.scene != null ) {
            fileName = fileName + scenario.scene + '_';
          }
          fileName = fileName + viewport_index + '_' + vp.name + '.png'

          var reference_FP  = bitmaps_reference + '/' + fileName;
          var test_FP       = bitmaps_test + '/' + screenshotDateTime + '/' + fileName;

          var filePath      = (isReference)?reference_FP:test_FP;


          if (casper.exists(o)) {
            if (casper.visible(o)) {
              casper.captureSelector(filePath, o);
            } else {
              var assetData = fs.read(hiddenSelectorPath, 'b');
              fs.write(filePath, assetData, 'b');
            }
          } else {
            var assetData = fs.read(selectorNotFoundPath, 'b');
            fs.write(filePath, assetData, 'b');
          }

          if (!isReference) {
            compareConfig.testPairs.push({
              reference:reference_FP,
              test:test_FP,
              selector:o,
              fileName:fileName,
              label:scenario.label,
              misMatchThreshold: scenario.misMatchThreshold,
              local_reference: reference_FP,
              local_test: test_FP
            });
          }
          //casper.echo('remote capture to > '+filePath,'info');

        });//end topLevelModules.forEach

      });

    });//end casper.each viewports

  });//end casper.each scenario

}


//========================
//this query should be moved to the prior process
//`isReference` could be better passed as env parameter
var exists = fs.exists(bitmaps_reference);
var isReference = false;
if(!exists){isReference=true; console.log('CREATING NEW REFERENCE FILES')}
//========================


capturePageSelectors(
  'index.html'
  ,scenarios
  ,viewports
  ,bitmaps_reference
  ,bitmaps_test
  ,isReference
  ,scriptTimeout
);

casper.run(function(){
  complete();
  this.exit();
});

function complete(){
  var configData = JSON.stringify(compareConfig,null,2);
  fs.touch(compareConfigFileName);
  fs.write(compareConfigFileName, configData, 'w');
  console.log(
    'Comparison config file updated.'
    //,configData
  );
}

function pad(number) {
  var r = String(number);
  if ( r.length === 1 ) {
    r = '0' + r;
  }
  return r;
}
