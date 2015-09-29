'use strict';

var gulp = require('gulp');
// var concat = require('gulp-concat');
// var uglify = require('gulp-uglify');
// var imagemin = require('gulp-imagemin');
// var sourcemaps = require('gulp-sourcemaps');
var RevAll = require('gulp-rev-all');
var sass = require('gulp-sass');
var babel = require('gulp-babel');
var filter = require('gulp-filter');
var clean = require('gulp-clean');
var useref = require('gulp-useref');
var bsync = require('browser-sync').create();
// var watch = require('gulp-watch');
var path = require('path');

var paths = {
  appScripts: ['./src/**/*.js'],
  assets: ['./assets/**', '!assets/bower_components/**'],
  tmp: './tmp/',
  build: './build/'
};

gulp.task('clean', function () {
  return gulp.src([paths.tmp, paths.build])
    .pipe(clean({force: true}));
});

gulp.task('script:build', function() {
  return gulp.src(paths.appScripts).pipe(babel({
        blacklist: ['regenerator', 'es6.templateLiterals'],
        optional: ['asyncToGenerator']}))
    .pipe(gulp.dest(paths.build));
});

gulp.task('static:build', function () {
  var jsBowerDepends = [
    'assets/bower_components/scrollreveal/dist/scrollReveal.min.js'
  ];
  gulp.src(jsBowerDepends)
    .pipe(gulp.dest(paths.tmp + '/js'));

  gulp.src(['assets/js/**/*'])
    .pipe(gulp.dest(paths.tmp + '/js'));

  gulp.src(['assets/css/**/*'])
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(paths.tmp + '/css'));

  gulp.src(['assets/**/*.html'])
    .pipe(gulp.dest(paths.tmp));

  gulp.src(['assets/img/**/*'])
    .pipe(gulp.dest(paths.tmp + '/img'));

});

gulp.task('static:release', ['static:build'], function () {
  var revAll = new RevAll({
    dontRenameFile: [/^\/favicon.ico$/g, '.html'],
    dontGlobal: [/^\/favicon.ico$/g],
    dontUpdateReference: ['.html'],
    debug: true,
    prefix: 'http://avc.dcsl.sdf/'
  });
  var assets = useref.assets();
  var htmlFilter = filter(['**/*.html'], {restore: true});
  gulp.src(paths.tmp + '**/*')
    .pipe(htmlFilter)
    .pipe(assets)
    .pipe(assets.restore())
    .pipe(useref())
    .pipe(htmlFilter.restore)
    .pipe(revAll.revision())
    .pipe(gulp.dest(paths.build + 'static'))
    .on('end', function () {
      gulp.src(paths.build + 'static/**/*.html')
        .pipe(gulp.dest(paths.build + 'views'))
        .on('end', function () {
          gulp.src(paths.build + 'static/**/*.html')
          .pipe(clean());
        });
    });
});

gulp.task('build', ['static:release', 'script:build']);

gulp.task('watch', ['build'], function () {
  gulp.watch(paths.appScripts, ['script:build']);
  gulp.watch(paths.assets, ['static:release']);
});

gulp.task('watch:static', ['static:build'], function () {
  bsync.init({
    files: paths.tmp,
    server: {
      baseDir: paths.tmp,
      directory: true
    }
  });
  gulp.watch(paths.assets, ['static:build']);
  //gulp.watch(paths.tmp + '**', bsync.reload).on('all', function (e) {
  //  console.log(e.type);
  //})
});

gulp.task('bsync-server', function () {
  bsync.init({
    proxy: 'localhost:3000'
  });
});
