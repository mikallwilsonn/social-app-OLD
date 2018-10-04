const express = require( 'express' );
const app = express();

const mongoose = require( 'mongoose' );
const Notification = mongoose.model( 'Notification' );

exports.checkNotifications = async ( req, res, next ) => {

  if ( req.user ) {

    req.has_notifications = await Notification.find( { notify: req.user._id } )
        .sort({ date_posted: 'descending' })
        .populate( 'actor' )
        .populate( 'medium_owner' );
    
      next();

  } else {
    next();
  }

}