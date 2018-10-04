// Controller Dependencies
const passport = require( 'passport' );
const crypto = require( 'crypto' );
const mongoose = require( 'mongoose' );
const promisify = require( 'es6-promisify' );
const mail = require( '../handlers/mail' );

// Models
const User = mongoose.model( 'User' );

// ----
// Check for User Suspension
// -> Query database for a User document that has the
// -> email property that equals to the email passed on
// -> the login form. If the suspended property is FALSE then
// -> allow login, else prevent login and redirect back
exports.checkForSuspension = async ( req, res, next ) => {
    const account = await User.find({ email: req.body.email });

    if ( account.suspended == false || account.suspended == undefined || account.suspended == null ) {
        next();
    } else {
        req.flash( 'warning', 'Sorry, but you\'re account is currently under suspension. Please contact us to learn more and/or resolve this issue.' );
        res.redirect( '/' );
    }
}


// ----
// Login with User Credentials
// -> Using Passport.js, login a user with the credentials
// -> passed on /login form
exports.login = passport.authenticate( 'local', {
    failureRedirect: '/login',
    failureFlash: 'Failed Login!',
    successRedirect: '/',
    successFlash: 'You are now logged in!'
});


// ----
// Logout Current User Session
// -> Takes the currently active user session and 
// -> logs that user out, returning them to the /login form
exports.logout = ( req, res ) => {
    req.logout();
    req.flash( 'success', 'You are now logged out!');
    res.redirect( '/login' );
}


// ----
// Check if user is logged in or not
// -> Checks if there is a currently logged in user and if so
// -> either redirects to root, /welcome or back to /login
exports.isLoggedIn = ( req, res, next ) => {
    if ( req.user ) {
        if ( req.user.is_onboarded === false ) {
            req.flash( 'notice', 'Welcome! Looks like your profile could use some info. Let\'s take a moment and update that now before we can make your profile public.');
            res.redirect( '/welcome' );
        } else {
            next();
        }
    } else {
        res.redirect('/login');
    }
};


// ----
// Checks if user has the role of admin
// -> Determines if currently logged in user has the role
// -> of admin, if so then continues the route pipeline
// -> and if not then redirects to root
exports.isAdmin = ( req, res, next ) => {
    if ( req.user.role != 'admin' ) {
        res.redirect( '/' );
    } else if ( req.user.role == 'admin' ) {
        next();
    }
}


// ----
// Recover Password process
// -> Query database for a User with the email that was 
// -> passed through the forgot password form and if a User 
// -> exists then generates a random token to then be emailed
// -> to the email provived
exports.recoverPassword = async ( req, res ) => {

    const user = await User.findOne({ email: req.body.email });

    if ( !user ) {
        req.flash( 'error', 'If an account associated with that email exists, a password reset email has been sent to you.' );
        return res.redirect( '/login' );
    }

    user.resetPasswordToken = crypto.randomBytes( 20 ).toString( 'hex' );
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();

    const resetURL = `http://${req.headers.host}/reset/${user.resetPasswordToken}`;
    await mail.send({
        to: user.email,
        subject: 'Password Reset',
        resetURL,
        filename: 'password-reset'
    });

    req.flash( 'success', 'You have been emailed a password reset link.' );
    res.redirect( '/login' );
};


// ----
// Reset Password
// -> After being emailed in the previous step, checks the token URL
// -> parameter on User documents, and if one exists and matches to then
// -> redirect the user to a form to enter a new password
exports.resetPassword = ( req, res ) => {
    const user = User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if ( !user ) {
        req.flash( 'error', 'Password reset is invalid or has expired.' );
        res.redirect( '/login' );
    }

    res.render( 'reset', { title: 'Recover Your Password' });
}


// ----
// Confirm Passwords for Password Reset
// -> Confirms on the server side that both passwords match
// -> before saving
exports.confirmPasswordReset = ( req, res, next ) => {
    if ( req.body.password === req.body['password-confirm'] ) {
        next();
        return;
    }

    req.flash( 'error', 'Passwords do not match.' );
    res.redirect( 'back' );
}


// ----
// Update New Password after reset
// -> Query database for a User document that matches the
// -> reset token and then, once again, if one exists to
// -> then update that users password
exports.updatePassword = async ( req, res ) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if ( !user ) {
        req.flash( 'error', 'Password reset is invalid or has expired.' );
        res.redirect( '/login' );
    }

    const setPassword = promisify( user.setPassword, user );
    await setPassword( req.body.password );
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    const updatedUser = await user.save();

    req.flash( 'success', 'Success! You may not login with your new password.' );
    res.redirect( '/login' );
}


// ----
// Check if Email exists
// -> Upon registration of a new user, query the database
// -> for a User document with the email provided, and if one
// -> exists to then redirect back to prevent users with the
// -> same email
exports.registerDoesEmailExist = async ( req, res, next ) => {
    let email = req.body.email;
    User.find( { email: email }, function( err, docs ) {
        if ( !docs.length ) {
            next();
        } else {
            req.flash( 'caution', 'The email you provided already belongs to an account.' );
            res.redirect( 'back' );
        }
    });
}


// ----
// Check Email on User Update
// -> Much like previous step ^^^, checks email when a user updaites
// -> their settings within the /settings route
exports.updateDoesEmailExist = async ( req, res, next ) => {
    let email = req.body.email;

    if ( email == req.user.email ) {
        next();
        return;
    } 

    User.find( { email: email }, function( err, docs ) {
        if ( !docs.length ) {
            next();
        } else {
            req.flash( 'caution', 'The email you provided already belongs to an account.' );
            res.redirect( 'back' );
        }
    });
}


// ----
// Check if Username exists
// -> Much like previous steps to check Email this checks
// -> for a User document based on the username
exports.registerDoesUsernameExist = async ( req, res, next ) => {
    let username = req.body.username;
    User.find( { username: username }, function( err, docs ) {
        if ( !docs.length ) {
            next();
        } else {
            req.flash( 'caution', 'The username you provided already belongs to an account.' );
            res.redirect( 'back' );
        }
    });
}


// ----
// Check if Username exists on Update
// -> Much like previous steps to check Email this checks
// -> for a User document based on the username when a user
// -> updates their user account
exports.updateDoesUsernameExist = async ( req, res, next ) => {
    let username = req.body.username;

    if ( username == req.user.username ) {
        next();
        return;
    } 

    User.find( { username: username }, function( err, docs ) {
        if ( !docs.length ) {
            next();
        } else {
            req.flash( 'caution', 'The username you provided already belongs to an account.' );
            res.redirect( 'back' );
        }
    });
}