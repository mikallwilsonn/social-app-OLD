// Controller Dependencies
const mongoose = require( 'mongoose' );

// Models
const User = mongoose.model( 'User' );
const Post = mongoose.model( 'Post' );


// ----
// Get currently logged in user's profile
// -> Queries the database for a User document that has the 
// -> _id property that matches the current user session as well
// -> as querying for all Post documents that have an author 
// -> property that matches the _id of the current user
exports.myProfile = async ( req, res ) => {

    const user = await User.findOne( { _id: req.user._id } );
    const posts = await Post
        .find( { author: req.user._id })
        .sort({ date_posted: 'descending' });

    let email;

    if ( user.contact.email === true ) {
        email = user.email;
    } else {
        email = '';
    }

    res.render( 'profile', {
        username: user.username,
        avatar: user.avatar,
        profile_cover: user.profile_cover,
        title: user.name,
        email: email,
        profile: user.profile,
        contact: user.contact,
        joined_at: user.joined_at,
        why_started: user.why_started,
        motivation: user.motivation,
        goal: user.goal,
        posts,
        comments: posts.comments,
        isCurrentUser: true,
        postControls: true,
        role: user.role
    });
}


// ----
// Recent Activity
// -> Queries the database for all Post documents that have an
// -> author property that matches an _id stored within the 
// -> current users following array
exports.recentActivity = async ( req, res ) => {

    const usersToCheck = req.user.following;
    usersToCheck.push( req.user._id );

    const posts = await Post.find({ 
        'author': {
            $in: usersToCheck
        } 
    })
    .sort({ date_posted: 'descending' });

    res.render( 'feed', {
        pretitle: 'Welcome back!',
        title: 'Recent Activity',
        posts: posts
    });
}