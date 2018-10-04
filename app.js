const createError = require( 'http-errors' );
const express = require( 'express' );
const session = require( 'express-session' );
const mongoose = require( 'mongoose' );
const MongoStore = require( 'connect-mongo' )( session );
const passport = require( 'passport' );
const promisify = require( 'es6-promisify' )
const path = require( 'path' );
const cookieParser = require( 'cookie-parser' );
const logger = require( 'morgan' );
const helpers = require( './helpers' );
const cloudinary = require( 'cloudinary' );
const hbs = require( 'hbs' );
const flash = require( 'connect-flash' );
const expressValidator = require( 'express-validator' );
const bodyParser = require( 'body-parser' );
const errorHandlers = require( './handlers/errorHandlers' );
const notifications = require( './handlers/notifications' );
require( './handlers/passport' );
require( 'dotenv' ).config({ path: 'variables.env' });
const routes = require( './routes/index.js' );
const app = express();
 

// ----
// View Engine Setup
app.set( 'views', path.join( __dirname, 'views' ));
app.set( 'view engine', 'hbs' );
hbs.registerPartials( __dirname + '/views/partials' );


// ----
// Assorted App middleware configurations
app.use( logger( 'dev' ));
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({ extended: true }) );
app.use( expressValidator() );
app.use( cookieParser() );
app.use( express.static( path.join( __dirname, 'public' )));
app.use( flash() );


// ----
// Sessions
app.use(session({
  secret: process.env.SECRET,
  key: process.env.KEY,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

app.use( passport.initialize() );
app.use( passport.session() );

app.use(function( req, res, next) {
  res.locals.user = req.user;
  next();
});

// ----
// Check if role: 'admin'
app.use(( req, res, next) => {
  if ( !req.user ) {
    next();
  } else {
    if ( req.user.role == "admin" ) {
      res.locals.isAdmin = true;
    } else if ( req.user.role == undefined || req.user.role == null ) {
      res.locals.isAdmin = false;
    } else {
      res.locals.isAdmin = false;
    }
    next();
  }

});


// ----
// Variables to pass to all templates
app.use( ( req, res, next ) => {
  res.locals.flashes = req.flash();
  res.locals.h = helpers;
  res.locals.currentPath = req.path;
  next();
});


app.use(( req, res, next ) => {
  req.login = promisify( req.login, req );
  next();
});


// ----
// Check for notifications
app.all( '*', notifications.checkNotifications );
app.use( function( req, res, next ) {
  res.locals.notifications = req.has_notifications;
  next();
});

// ----
// Cloundiary config
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


// ----
// Routes
app.use( '/', routes );


// ----
// Catch 404 and forward to error handler
app.use( function( req, res, next ) {
  next( createError( 404 ));
});


// ----
// Error Handlers
app.use( errorHandlers.notFound );
app.use( errorHandlers.flashValidationErrors );

if ( app.get( 'env' ) === 'development' ) {
  app.use( errorHandlers.developmentErrors );
}

app.use( errorHandlers.productionErrors );


module.exports = app;
