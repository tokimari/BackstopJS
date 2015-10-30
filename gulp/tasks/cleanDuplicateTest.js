var gulp                 = require('gulp');
var fs                   = require('fs');
var del                  = require('del');
var paths                = require('../util/paths');
var genConfigPath        = 'capture/config.json'
var pastTestListFileName = paths.comparePath + '/past_tests.json'

//clean the bitmaps_reference directory
gulp.task('cleanDuplicateTest', ['updateHistory'], function (cb) {

  var configJSON = fs.readFileSync(genConfigPath);
  var config = JSON.parse(configJSON);
  var capturedHash = config.captured_hash;
  var existsPastTests = fs.existsSync(pastTestListFileName);
  if(!capturedHash || !existsPastTests) {
    if(cb) cb();
    return;
  }

  var pastTestList = JSON.parse(fs.readFileSync(pastTestListFileName, 'utf8'));
  if(!pastTestList.tests.length) {
    if(cb) cb();
    return;
  }
  console.log('Checking duplicate commit tests.', pastTestList.tests);
  pastTestList.tests.forEach(function(test) {
    var matched = test.match(capturedHash);
    if(!matched) {
      if(cb) cb();
      return;
    }
    console.log('Duplicate commit test files was cleaned.', test);

    var compareConfigFileName = 'compare/' + config.paths.compare_data || 'compare/config-' + capturedHash + '.json';
    del([
      paths.bitmaps_test + '/' + test
    ], {force: true}, function() {
      if(cb) cb();
    });
  });
});
