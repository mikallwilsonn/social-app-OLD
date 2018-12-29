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
    }).sort({ name: 'asc' });

    res.render( 'messages-newChat', {
        title: 'Who would you like to chat with today?',
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

    const messages = await Chat.find({ 'participants._user': req.user._id, open: true });

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

    let currentUser = req.user._id.toString();
    let index = chat.participants.findIndex( item => item._user._id != currentUser );
    let chatWith = chat.participants[index]._user;

    const messages = await Chat.find({ 'participants._user': req.user._id, open: true });

    res.render( 'messages', {
        title: `Chat with ${chatWith.name}`,
        pretitle: 'Messages',
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


// ----
// Close Chat
exports.closeChat = async ( req, res ) => {
    await Chat.findByIdAndUpdate(
        req.params.chat_id, 
        { $set: { open: false }},
        { 
            new: true,
            runValidators: true,
            context: 'query' 
        }
        
    );

    req.flash( 'success', 'You successfully closed the chat.' );
    res.redirect( 'back' );
}


// ----
// Reopen Chat
exports.reopenChat = async ( req, res ) => {
    await Chat.findByIdAndUpdate(
        req.params.chat_id, 
        { $set: { open: true }},
        { 
            new: true,
            runValidators: true,
            context: 'query' 
        }
        
    );

    req.flash( 'success', 'You successfully reopened the chat.' );
    res.redirect( 'back' );
}