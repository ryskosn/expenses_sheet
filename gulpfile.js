var gulp = require('gulp');
var mocha = require('gulp-mocha');

gulp.task('hello', function() { console.log('Hello gulp!'); });
gulp.task('default', ['hello']);

gulp.task('test_raw', function() {
  gulp.src('./test/*.js', {read: false}).pipe(mocha());
});

gulp.task('test', function() {
  gulp.src('./test/*.js', {read: false}).pipe(mocha({
    // for power-assert
    require: ['intelli-espower-loader']
  }));
});

gulp.task('watch', function() { gulp.watch('./test/*.js', ['test']); });