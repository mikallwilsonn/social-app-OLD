// Controller Dependencies
const mongoose = require( 'mongoose' );
const ObjectId = require( 'mongodb' ).ObjectId;

// Models
const User = mongoose.model( 'User' );
const Post = mongoose.model( 'Post' );
const Notification = mongoose.model( 'Notification' );
const AccountInvite = mongoose.model( 'AccountInvite' );

exports.getMessages = async ( req, res ) => {
    let following = req.user.following;
    let followers = req.user.followers;
    let users_to_get = following.concat( followers );
    
    const users = await User.find({
        _id: {
            $in: users_to_get
        }
    });

    res.render( 'messages', {
        title: 'My Messages',
        pretitle: 'Messages',
        users: users
    });
}