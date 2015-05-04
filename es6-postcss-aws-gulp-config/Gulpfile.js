
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')({pattern: ['gulp-*', 'postcss-*', 'run-sequence', 'del', 'browserify', 'babelify', 'watchify', 'autoprefixer-*', 'vinyl-*', 'lodash.*'],rename: {'lodash.assign': 'assign', 'autoprefixer-core' : 'autoprefixer'}});

var config = {
  root: './app/',
  src: './app/src/',
  dist: './app/dist/',
  port: 1337,
  supported: 'ios 7'
};


// tasks for dev env
gulp.task('styles', function () {

  var processors = [
    plugins.postcssImport,
    plugins.postcssNested,
    plugins.postcssSimpleVars,
    plugins.autoprefixer({browsers: [config.supported]})
  ];

  return gulp.src(config.src + 'preCSS/app.pre.css')
        .pipe(plugins.postcss(processors))
        .pipe(plugins.rename('app.css'))
        .pipe(gulp.dest(config.src + 'preCSS/'))
        .pipe(plugins.connect.reload());

});

gulp.task('connect', function() {
  return plugins.connect.server({
            root: config.root,
            port: config.port,
            livereload: true
          });
});

gulp.task('watch', function() {
  return gulp.watch([config.src + 'preCSS/**/*.css', '!' + config.src + 'preCSS/app.css' ], ['styles']);
});


// browserify incl. babel / watchify
function compileJS(isBuild) {

  var opts = plugins.assign({}, plugins.watchify.args, {
    entries: [config.src + 'js/app.js'],
    debug: true
  });
  var b = isBuild ? plugins.browserify(opts) : plugins.watchify(plugins.browserify(opts));

  b.transform(plugins.babelify);
  b.on('update', bundle);
  b.on('log', plugins.util.log);

  function bundle() {
    return b.bundle()
            .on('error', plugins.util.log.bind(plugins.gutil, 'Browserify Error'))
            .pipe(plugins.vinylSourceStream('app.bundled.js'))
            .pipe(plugins.vinylBuffer())
            .pipe(plugins.sourcemaps.init({loadMaps: true}))
            .pipe(plugins.sourcemaps.write('./'))
            .pipe(gulp.dest(config.src + 'js/'))
            .pipe(plugins.connect.reload());
  }

  return bundle();

}

gulp.task('js', function(){compileJS()});
gulp.task('js:build', function(){compileJS(true)});


// build tasks for prod env
gulp.task('clean:dist', function (cb) {
  return plugins.del([
            config.dist + '**/*'
          ], cb);
});

gulp.task('copy', function (cb) {
  gulp.src(config.src + 'img/**/*')
    .pipe(gulp.dest(config.dist + 'img/'));

  return gulp.src(config.src + 'data/**/*')
    .pipe(gulp.dest(config.dist + 'data/'));

});

gulp.task('uglify', function() {
  return gulp.src(config.src + 'js/app.bundled.js')
          .pipe(plugins.uglify())
          .pipe(plugins.rename('app.min.js'))
          .pipe(gulp.dest(config.dist + 'js'));
});

gulp.task('cssmin', function () {
  return gulp.src(config.src + 'preCSS/app.css')
          .pipe(plugins.cssmin())
          .pipe(plugins.rename({suffix: '.min'}))
          .pipe(gulp.dest(config.dist + 'css'));
});

gulp.task('useref', function () {
  return gulp.src(config.src + 'index.html')
          .pipe(plugins.useref())
          .pipe(gulp.dest(config.dist));
});


// deploy to AWS
var aws = {
    "key": "...",
    "secret": "...",
    "bucket": "...",
    "region": "...",
    "distributionId": "..."
};

var publisher = plugins.awspublish.create(aws);
var headers = {'Cache-Control': 'max-age=315360000, no-transform, public'};

gulp.task('aws', function () {
    var revAll = new plugins.revAll();
    return gulp.src(config.dist + '**/*')
            .pipe(revAll.revision())
            .pipe(plugins.awspublish.gzip())
            .pipe(publisher.publish(headers))
            .pipe(publisher.cache())
            .pipe(plugins.awspublish.reporter())
            .pipe(plugins.cloudfront(aws));
});


// cli tasks
gulp.task('default', function(){plugins.runSequence(['styles','js'],['connect','watch'])});
gulp.task('build', function(){plugins.runSequence('clean:dist',['styles','js:build', 'copy'], ['cssmin','uglify', 'useref'])});
gulp.task('deploy', function(){plugins.runSequence('aws')});
