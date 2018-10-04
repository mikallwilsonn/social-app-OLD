// Controller Dependencies
const mongoose = require( 'mongoose' );
const moment = require( 'moment' );

// Models
const Post = mongoose.model( 'Post' );
const User = mongoose.model( 'User' ); 


// --------
// Post Management
// --------

// Get Reported Posts
// -> Query database for all Post documents that 
// -> have the property of reports.is_reported = TRUE
// -> before rendering the posts view from admin folder
exports.getReportedPosts = async ( req, res ) => {
    const posts = await Post.find({ 'reports.is_reported': true })
        .sort({ date_posted: 'descending' });

    res.render( 'admin/posts', {
        title: 'Manage Reported Posts',
        posts: posts
    });
}


// --------
// User Management
// --------

// Get Users
// -> Query database to get ALL User documents before 
// -> rendering the user view from admin folder
exports.getUsers = async ( req, res ) => {
    const users = await User.find({ suspended: false });

    res.render( 'admin/users', {
        title: 'Manage Users',
        users: users
    });
}

exports.getSuspendedUsers = async ( req, res ) => {
    const users = await User.find({ suspended: true });

    res.render( 'admin/users', {
        title: 'Manage Users',
        users: users
    });
}

// Edit User
// -> Query database to get a User document where the _id property 
// -> matches the URL parameter of :user_id before
// -> rendering the editUser view from admin folder
exports.editUser = async ( req, res ) => {
    const account = await User.findById( req.params.user_id );
    
    res.render( 'admin/editUser', {
        title: 'Edit User',
        account: account
    });
}

// Update User
// -> Reformats the birthday date to prevent bugs and then compiles
// -> all user account information into an updates object to be passed
// -> into the update function for a specific user determined by the
// -> URL parameter of :user_id
exports.updateUser = async ( req, res ) => {

    let birthday = moment( req.body.birthday ).format( 'Y-M-D');
    birthday = birthday + ' 00:00:00.000';

    const updates = {
        name: req.body.name,
        email: req.body.email,
        profile: req.body.profile,
        username: req.body.username,
        goal: req.body.goal,
        why_started: req.body.why_started,
        motivation: req.body.motivation,
        website: req.body.website,
        location: req.body.location,
        birthday: birthday,
        social_facebook: req.body.social_facebook,
        social_twitter: req.body.social_twitter,
        social_instagram: req.body.social_instagram,
        social_linkedin: req.body.social_linkedin,
        role: req.body.role
    }

    const user = await User.findOneAndUpdate(
        { _id: req.params.user_id },
        { $set: updates },
        {
            new: true,
            runValidators: true,
            context: 'query'
        }
    );

    req.flash( 'success', `You successfully updated the account settings for ${req.body.name}.` );
    res.redirect( 'back' );
}


// Suspend User
// -> Query database for a User document with the URL parameter
// -> of :user_id, then if a User document is found to then 
// -> update that documents suspended property to TRUE
exports.suspendUser = async ( req, res ) => {
    const account = await User.findById( req.params.user_id );

    if ( account ) {
        const suspension = { 
            suspended: true
        };

        const user_to_update = await User.findOneAndUpdate(
            { _id: account._id },
            { $set: suspension },
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        );
    }

    req.flash( 'caution', `You have suspended ${account.name}'s account. They will not be able to login until the suspension has been revoked.` );
    res.redirect( 'back' );
}

// Unsuspend User
// -> Query database for a User document with the URL parameter
// -> of :user_id, then if a User document is found update it's
// -> property of suspended to FALSE
exports.unsuspendUser = async ( req, res ) => {
    const account = await User.findById( req.params.user_id );

    if ( account ) {
        const suspension = { 
            suspended: false
        };

        const user_to_update = await User.findOneAndUpdate(
            { _id: account._id },
            { $set: suspension },
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        );
    }

    req.flash( 'success', `You sucessfully revoked the suspension on ${account.name}'s account.` );
    res.redirect( 'back' ); 
}

// Delete User
// -> Query database for a User document with the URL parameter
// -> of :user_id and if one is found to then DELETE it's record
// -> from the database. Then, the same _id property, delete all
// -> Post documents with the author property that equals the _id
exports.deleteUser = async ( req, res ) => {
    const account = await User.findById( req.params.user_id );

    if ( !account ) {
        req.flash( 'error', 'Uh oh, something happened and the user could not be deleted.' );
        res.redirect( 'back' );
    }

    await User.deleteOne({ _id: account._id });
    await Post.deleteMany({ author: account._id });

    req.flash( 'success', `The user account for ${account.name} has been successfully deleted.` );
    res.redirect( 'back' ); 
}

