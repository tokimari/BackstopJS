var gulp                    = require('gulp');
var del                     = require('del');
var paths                   = require('../util/paths');
var genDefaultCompareConfig = require('../util/genDefaultCompareConfig');


//CLEAN THE bitmaps_reference DIRECTORY
gulp.task('clean', function (cb) {
  del([
    paths.bitmaps_reference + '/**'
  ], {force: true}, cb);
  console.log('bitmaps_reference was cleaned.');
});
