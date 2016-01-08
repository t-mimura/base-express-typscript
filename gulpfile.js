var gulp = require('gulp');
var less = require('gulp-less');
var path = require('path');
var mocha = require('gulp-mocha');
var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');
var cp = require('child_process');
var tsb = require('gulp-tsb');

var conf = {
  path: {
    src: {
      app: 'src/app',
      tests: 'src/tests'
    },
    dist: {
      app: 'dist/app',
      tests: 'dist/tests'
    }
  }
};

// compile less files from the ./styles folder
// into css files to the ./public/stylesheets folder
gulp.task('less', function () {
  return gulp.src(path.join(conf.path.src.app, 'styles/**/*.less'))
    .pipe(less({
      paths: [path.join(__dirname, 'less', 'includes')]
    }))
    .pipe(gulp.dest(path.join(conf.path.dist.app, 'public/stylesheets')));
});

// run mocha tests in the ./tests folder
gulp.task('test', ['buildTests'], function () {

  return gulp.src(path.join(conf.path.dist.tests, 'test*.js'), { read: false })
  // gulp-mocha needs filepaths so you can't have any plugins before it
    .pipe(mocha());
});

// run browser-sync on for client changes
gulp.task('browser-sync', ['nodemon', 'watch'], function () {
  browserSync.init(null, {
    proxy: "http://localhost:3000",
    files: [
      path.join(conf.path.dist.app, "public/**/*.*"),
      path.join(conf.path.dist.app, "views/**/*.*")
    ],
    browser: "google chrome",
    port: 7000,
  });
});

// run nodemon on server file changes
gulp.task('nodemon', function (cb) {
  var started = false;

  return nodemon({
    script: path.join(conf.path.dist.app, '/www.js'),
    watch: [
      path.join(conf.path.dist.app, '**/*.js')
    ]
  }).on('start', function () {
    if (!started) {
      cb();
      started = true;
    }
  }).on('restart', function onRestart() {
    setTimeout(function reload() {
      browserSync.reload({
        stream: false
      });
    }, 500);  // browserSync reload delay
  });
});

// TypeScript build for /src folder, pipes in .d.ts files from typings folder
var tsConfigSrc = tsb.create(path.join(conf.path.src.app, 'tsconfig.json'));
gulp.task('build', function () {
  return gulp.src([
      path.join(conf.path.src.app, '**/*.ts')
    ])
    .pipe(tsConfigSrc())
    .pipe(gulp.dest(conf.path.dist.app));
});

// TypeScript build for /tests folder, pipes in .d.ts files from typings folder
// as well as the src/tsd.d.ts which is referenced by tests/tsd.d.ts
var tsConfigTests = tsb.create(path.join(conf.path.src.tests, 'tsconfig.json'));
gulp.task('buildTests', function () {
  // pipe in all necessary files
  return gulp.src([
      path.join(conf.path.src.tests, '**/*.ts')
    ])
    .pipe(tsConfigTests())
    .pipe(gulp.dest(conf.path.dist.tests));
});

// jade files copy to dist directory.
gulp.task('views', function (cb) {
  return gulp.src([
    path.join(conf.path.src.app, 'views/**/*.jade')
  ]).pipe(gulp.dest(path.join(conf.path.dist.app, 'views')));
});

// watch for any TypeScript or LESS file changes
// if a file change is detected, run the TypeScript or LESS compile gulp tasks
gulp.task('watch', function () {
  gulp.watch(path.join(conf.path.src.app, '**/*.ts'), ['build']);
  gulp.watch(path.join(conf.path.src.app, 'views/**/*.jade'), ['views']);
  gulp.watch(path.join(conf.path.src.app, 'styles/**/*.less'), ['less']);
});

gulp.task('buildAll', ['build', 'buildTests', 'less', 'views']);
gulp.task('default', ['browser-sync']);
