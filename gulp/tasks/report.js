var gulp = require('gulp');
var fs    = require('fs');
var paths = require('../util/paths');

var pastTestListFileName = paths.comparePath + '/past_tests.json'

gulp.task('report',['start','updateHistory'],function(){

  if (!paths.report || paths.report.indexOf( 'browser' ) > -1 ){
    setTimeout(function(){gulp.run('openReport')},100);
  }

  if (!paths.report || paths.report.indexOf( 'CLI' ) > -1 ){
    setTimeout(function(){gulp.run('compare')},1000);
  }
});
