
const gulp = require( 'gulp' );
const concat = require( 'gulp-concat' );
const uglify = require( 'gulp-uglify-es' ).default;
const cleanCSS = require( 'gulp-clean-css' );
const rename = require( 'gulp-rename' );
const maps = require( 'gulp-sourcemaps' );
const del = require( 'del' );


// ----
// Concatenate Stylesheets
gulp.task( 'concatStyles', ['clean'], function() {

    return gulp.src([
        'public/fonts/feather/feather.min.css',
        'public/libs/highlight/styles/vs2015.min.css',
        'public/libs/flatpickr/dist/flatpickr.min.css',
        'public/stylesheets/theme.min.css',
        'public/libs/mediaelement/build/mediaelementplayer.css',
        'public/stylesheets/style.css'
    ])
        .pipe( maps.init() )
        .pipe( concat( 'app_bundle.css' ))
        .pipe( maps.write( './' ))
        .pipe( gulp.dest( 'public/dist/' ));
        //.pipe( console.log( 'All CSS files have been successfully concatenated.' ));

});



// ----
// Minify Styles
gulp.task( 'minifyStyles', ['concatStyles'], function() {

    return gulp.src( 'public/dist/app_bundle.css' )
        .pipe( cleanCSS({ compatibility: 'ie8' }))
        .pipe( rename( 'app_bundle.min.css' ))
        .pipe( gulp.dest( 'public/dist/' ));
        //.pipe( console.log( 'Your CSS has been successfully minified and an associated sourcemap was created.' ));

});


// ----
// Concatenate Scripts
gulp.task( 'concatScripts', ['clean'], function() {

    return gulp.src([
        'pubic/libs/jquery/dist/jquery.min.js',
        'public/libs/mediaelement/build/mediaelement.js',
        'public/libs/mediaelement/build/mediaelement-and-player.js',
        'public/libs/bootstrap/dist/js/bootstrap.bundle.min.js',
        'public/libs/chart.js/dist/Chart.min.js',
        'public/libs/chart.js/Chart.extension.min.js',
        'public/libs/highlight/highlight.pack.min.js',
        'public/libs/flatpickr/dist/flatpickr.min.js',
        'public/libs/jquery-mask-plugin/dist/jquery.mask.min.js',
        'public/libs/list.js/dist/list.min.js',
        'public/javascripts/theme.min.js',
        'public/javascripts/scripts.js'
    ])
        .pipe( maps.init() )
        .pipe( concat( 'app_bundle.js' ))
        .pipe( maps.write( './' ))
        .pipe( gulp.dest( 'public/dist/' ));
        //.pipe( console.log( 'All JavaScript files have been sucessfully concatenated.' ));

});


// ----
// Minify Scripts
gulp.task( 'minifyScripts', ['concatScripts'], function() {

    return gulp.src( 'public/dist/app_bundle.js' )
        .pipe( uglify().on( 'error', function( e ) { console.log( e ) }))
        .pipe( rename( 'app_bundle.min.js' ))
        .pipe( gulp.dest( 'public/dist/' ));
        //.pipe( console.log( 'Your JavaScript file has beeen successfully minified and an associated sourcemap was created.' ));

});


// ----
// Before build tasks run, delete files from previous build
gulp.task( 'clean', function() {

    del([ 'public/dist/*.css', 'public/dist/*.js', 'public/dist/*.map' ])
        .then( paths => {
            console.log( 'Deleted files from: \n', paths.join( '\n' ));
        });

});


// ----
// Gulp Build
gulp.task( 'build', [

    'clean',
    'concatStyles',
    'minifyStyles',
    'concatScripts',
    'minifyScripts'

]);