var gulp = require('gulp');
var mocha = require('gulp-mocha');
var paths = {test: "./test/*.js"};

gulp.task('test_raw', function() {
  gulp.src('./test/*.js', {read: false}).pipe(mocha());
});

gulp.task('test', function() {
  gulp.src(paths.test, {read: false}).pipe(mocha({
    // for power-assert
    require: ['intelli-espower-loader']
  }));
});

gulp.task('watch', function() { gulp.watch(paths.test, ['test']); });