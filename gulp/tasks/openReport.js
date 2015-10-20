var gulp  = require('gulp');
var open  = require("gulp-open");
var isWin = require('../util/isWin');
var paths = require('../util/paths');
var rename = require('gulp-rename');
var fs  = require('fs');

var referenceDir = './bitmaps_reference/';
var testDir = './bitmaps_test/';
var pastTestListFileName = paths.comparePath + '/past_tests.json'
var pastReferenceListFileName = paths.comparePath + '/past_references.json'

gulp.task("openReport", function(){

  console.log('\nTesting with ',paths.compareConfigFileName);
  console.log('Opening report -> ',paths.compareReportURL + '\n');

  // write past test dates data
  var pastTestsDate = fs.readdirSync(paths.bitmaps_test);
  fs.writeFile(pastTestListFileName, JSON.stringify({
    "dates": pastTestsDate
  }), function(err) {
    openReport();
  });

  var options = {
    url: paths.compareReportURL,
    app: isWin ? "chrome" : "Google Chrome"
  };

  // cache bitmaps_test files locally
  gulp.src(paths.bitmaps_test + '/**/*')
    .pipe(gulp.dest(testDir));

  // FIXME: これ必要？？
  var openReport = function() {
    gulp.src(paths.compareConfigFileName)
      .pipe(open("",options));
    }
});
