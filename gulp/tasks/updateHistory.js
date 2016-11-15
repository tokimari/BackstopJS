var gulp = require('gulp');
var fs    = require('fs');
var paths = require('../util/paths');

var pastTestListFileName = paths.comparePath + '/past_tests.json'

gulp.task('updateHistory', function(cb){
  var existsTestDir = fs.existsSync(paths.bitmaps_test);
  if(!existsTestDir) {
    if(cb) cb();
    return
  }

  var pastTestsDate = fs.readdirSync(paths.bitmaps_test);
  fs.writeFile(pastTestListFileName, JSON.stringify({
    "tests": pastTestsDate
  }), function(err) {
    if(err) {
      console.log('update: update error', pastTestsDate);
      return err;
    }
    console.log('update end:', pastTestsDate);
    if(cb) cb();
  });
});
