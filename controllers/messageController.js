// Controller Dependencies
const mongoose = require( 'mongoose' );
const ObjectId = require( 'mongodb' ).ObjectId;

// Models
const User = mongoose.model( 'User' );
const Post = mongoose.model( 'Post' );
const Chat = mongoose.model( 'Chat' );
const Notification = mongoose.model( 'Notification' );
const AccountInvite = mongoose.model( 'AccountInvite' );



// ----
// Get Users for new Chat
exports.newChat = async ( req, res ) => {
    let following = req.user.following;
    let followers = req.user.followers;
    let users_to_get = following.concat( followers );

    const users = await User.find({
        _id: {
            $in: users_to_get
        }
    });

    res.render( 'messages-newChat', {
        title: 'Pick a user to start a new chat with',
        pretitle: 'Messages',
        users: users
    });
}


// ----
// Create New Chat
exports.createNewChat = async ( req, res ) => {

    const account = await User.findOne({ _id: req.params.user_id });

    if ( !account ) {
        req.flash( 'error', 'Sorry. There was an issue opening a new chat. Please try again.' );
        res.redirect( 'back' );
        return;
    }

    const chat = {
        participants: [{
            _user: req.user._id,
            read: true
        }, {
            _user: account._id,
            read: false
        }],
        messages: []
    }

    const newChat = new Chat( chat );
    await newChat.save();

    res.redirect( `/messages/${newChat._id}` );

}


// ----
// Get All Messages
exports.getMessages = async ( req, res ) => {

    const messages = await Chat.find({ 'participants._user': req.user._id });

    res.render( 'messages', {
        title: 'My Messages',
        pretitle: 'Messages',
        messages: messages
    });
}


// ----
// Open chat
exports.openChat = async ( req, res ) => {
    const chat = await Chat.findOne({ 
        _id: req.params.chat_id,
         'participants._user': req.user._id
    });

    const messages = await Chat.find({ 'participants._user': req.user._id });

    res.render( 'messages', {
        title: 'My Messages',
        chat: chat,
        messages: messages
    });
}

// ----
// New Message
exports.newMessage = async ( req, res ) => {

    const newMessage = {
        message: req.body.message,
        _author: req.user._id,
        date_posted: Date.now()
    }
    
    await Chat.findByIdAndUpdate(
        req.params.chat_id,
        { $push: { "messages": newMessage }}, 
        { safe: true, new : true }
    );

    res.redirect( 'back' );
}