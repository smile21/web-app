'use strict';

var gulp = require('gulp');
// var concat = require('gulp-concat');
// var uglify = require('gulp-uglify');
// var imagemin = require('gulp-imagemin');
// var sourcemaps = require('gulp-sourcemaps');
var gutil = require("gulp-util");
var RevAll = require('gulp-rev-all');
var sass = require('gulp-sass');
var babel = require('gulp-babel');
var filter = require('gulp-filter');
var clean = require('gulp-clean');
var useref = require('gulp-useref');
var bsync = require('browser-sync').create();
// var watch = require('gulp-watch');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var path = require('path');

var webpackConfig = {
  entry: __dirname + '/assets/js/app.js',
  output: {
    path: __dirname + '/tmp',
    filename: 'js/bundle.js'
  },
  module: {
    loaders: [
      {test: /\.scss$/, loader: 'style-loader!css-loader!sass-loader'},
      {test: /\.(png|jpg)$/, loader: 'url-loader?limit=4096&name=img/[name].[ext]'},
      {
        test: /\.jsx?$/,
        loader: 'babel',
        exclude: /node_modules/,
        query: {
          blacklist: ['regenerator', 'es6.templateLiterals'],
          optional: ['asyncToGenerator']
        }
      },
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery"
    })
  ]
};

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

gulp.task('webpack:build', function (cb) {
  webpack(webpackConfig, function (err, stats) {
    if(err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({}));
    cb();
  });
});

gulp.task('webpack:watch', ['static:build'], function (cb) {

  var server = new WebpackDevServer(webpack(webpackConfig), {
    contentBase: __dirname + '/tmp',
    hot: true
  });

  server.listen(8080, 'localhost', function (err) {
    if (err) throw new gutil.PluginError('webpack-dev-server', err);
    gutil.log('[webpack-dev-server]', 'http://localhost:8080/webpack-dev-server/index.html');
    cb();
  });
});

gulp.task('script:build', function() {
  return gulp.src(paths.appScripts).pipe(babel({
        blacklist: ['regenerator', 'es6.templateLiterals'],
        optional: ['asyncToGenerator']}))
    .pipe(gulp.dest(paths.build));
});

gulp.task('static:build', ['webpack:build'], function () {
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

gulp.task('watch:static', ['static:build'], function () {
  bsync.init({
    files: paths.tmp,
    server: {
      baseDir: paths.tmp,
      //directory: true
    }
  });
  gulp.watch(paths.assets, ['static:build']);
});

