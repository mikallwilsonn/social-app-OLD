const mongoose = require( 'mongoose' );
require( 'dotenv' ).config({ path: 'variables.env' });


// ----
// Connect to Database
mongoose.connect( process.env.DATABASE, { useNewUrlParser: true } );
mongoose.Promise = global.Promise;
mongoose.connection.on( 'error', ( err ) => {
    console.error( `🚫 🚫 🚫 ${err.message} 🚫 🚫 🚫`);
});


// ----
// Import Models below
require( './models/User' );
require( './models/Post' );
require( './models/Comment' );
require( './models/Reply' );
require( './models/Notification' );
require( './models/AccountInvite' );
require( './models/Group' );
require( './models/Discussion' );
require( './models/Response' );


// ----
// Start the app
const app = require( './app' );
app.set( 'port', process.env.PORT || process.env.PORT_LOCAL );
const server = app.listen( app.get( 'port' ), ()=> {

    console.log( `Express running → PORT ${server.address().port}` );
    console.log( `Visit: http://localhost:${server.address().port}/` );
    console.log( `**NOTE** If changes have been made to public/javascripts/asyncScripts.js, be sure to run: 'npm run bundle-async-scripts'` );

});