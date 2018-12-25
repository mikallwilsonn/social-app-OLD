// Controller Dependencies
const mongoose = require( 'mongoose' );
const moment = require( 'moment' );
const uuidv5 = require( 'uuid/v5' );
const cloudinary = require( 'cloudinary' );

// Models
const Post = mongoose.model( 'Post' );
const User = mongoose.model( 'User' ); 
const AccountInvite = mongoose.model( 'AccountInvite' );
const Group = mongoose.model( 'Group' );
const Discussion = mongoose.model( 'Discussion' );


// --------
// Admin Access Management
// --------
exports.isAdminCheck = async ( req, res, next ) => {
    if ( req.user.role === 'admin' ) {
        next();
    } else {
        req.flash( 'error', 'Sorry, but you do not have access to this page.' );
        res.redirect( '/' );
        return;
    }
}


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

    let public;

    if ( req.body.privacy ) {
        public = true;
    } else {
        public = false;
    }

    let email_privacy;

    if ( req.body.email_privacy ) {
        email_privacy = true;
    } else {
        eemail_privacy = false;
    }

    const updates = {
        name: req.body.name,
        email: req.body.email,
        profile: {
            bio: req.body.bio,
            birthday: birthday,
            location: req.body.location,
            gender: req.body.gender,
            occupation: req.body.occupation,
            relationship_status: req.body.relationship_status,
            sexual_orientation: req.body.sexual_orientation,
            religion: req.body.religion,
            politics: req.body.politics
        },
        contact: {
            website: req.body.website,
            email: email_privacy,
            phone: req.body.phone
        },
        username: req.body.username,
        role: req.body.role,
        public: public
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

    if ( req.user._id === req.params.user_id ) {
        req.flash( 'error', 'You can\'t delete your own account.' );
        res.redirect( 'back' );
        return;
    } else {
        const account = await User.findById( req.params.user_id );

        if ( !account ) {
            req.flash( 'error', 'Uh oh, something happened and the user could not be deleted.' );
            res.redirect( 'back' );
        }
    
        await User.deleteOne({ _id: account._id });
        await Post.deleteMany({ author: account._id });
    
        req.flash( 'success', `The user account for ${account.name} has been successfully deleted.` );
        res.redirect( 'back' ); 
        return;
    }

}


// --------
// User Invite Management
// --------

// ----
// Get form to genereate a new invite
exports.generateInviteForm = async ( req, res ) => {
    res.render( 'admin/generate-invite', {
        title: 'Generate a new Account Invite'
    });
}


// ----
// On form submission, create a new invite
exports.createNewInviteKey = async ( req, res ) => {
    if ( req.user.role === 'admin' ) {
        const user_exists_check = await User.findOne({ email: req.body.email });

        if ( !user_exists_check ) {
            const invite_check = await AccountInvite.findOne({ email: req.body.email });

            if ( !invite_check ) {
                const new_invite_key = await uuidv5( req.body.email, uuidv5.URL );

                const invite = {
                    key: new_invite_key,
                    email: req.body.email,
                    request: false
                }

                const newAccountInvite = new AccountInvite( invite );
                await newAccountInvite.save();

                req.flash( 'success', 'You successfully created a new invite key.' );
                res.redirect( '/admin/manage-invites' );
                return;

            } else {
                req.flash( 'error', `You have already generated an invite for that email. Email: ${invite_check.email}, Key: ${invite_check.key}.` );
                res.redirect( 'back' );
                return;
            }
        } else {
            req.flash( 'error', `There is already a user with the email of: ${req.body.email}` );
            res.redirect( 'back' );
            return;
        }
    } else {
        req.flash( 'error', 'Sorry, but you need to be an admin user to complete this action.' );
        res.redirect( '/' );
        return;
    }
}


// ----
// Get current invite requests awaiting action
exports.getInviteRequests = async ( req, res ) => {
    const requests = await AccountInvite.find({ request: true });

    res.render( 'admin/invites', {
        title: 'Manage Invite Requests',
        invites: requests,
        invite_requests: true
    });
}


// ----
// Get all pending Invites waiting for account creation
exports.getAccountInvites = async ( req, res ) => {
    const invites = await AccountInvite.find({ request: false });
    res.render( 'admin/invites', {
        title: 'Manage Invites',
        invites: invites,
        manage_invites: true
    });
}


// ----
// Accept Invite Requests
exports.acceptInviteRequest = async ( req, res ) => {
    const invite_check = await AccountInvite.findOne({ _id: req.params.request_id });

    if ( !invite_check ) {
        req.flash( 'error', 'An error occured trying to locate the invite.' );
        res.redirect( 'back' );
        return;
    } else {
        const new_invite_key = await uuidv5( invite_check.email, uuidv5.URL );

        const updates = {
            key: new_invite_key,
            email: invite_check.email,
            request: false
        }

        const invite = await AccountInvite.findOneAndUpdate(
            { _id: req.params.request_id },
            { $set: updates },
            {
                new: true, 
                runValidators: true, 
                context: 'query'
            }
        );

        req.flash( 'success', 'You successfully accepted the request and created a new invite key.' );
        res.redirect( 'back' );
        return;
    }
}


// ----
// Reject Invite Requests
exports.rejectInviteRequest = async ( req, res ) => {
    await AccountInvite.findOneAndDelete({ _id: req.params.request_id });

    req.flash( 'success', 'You successfully rejected and deleted the invite request.' );
    res.redirect( 'back' );
    return;
}



// --------
// Group Management
// --------

// ----
// Get Groups
exports.getGroups = async ( req, res ) => {
    const groups = await Group.find();

    res.render( 'admin/groups', {
        title: 'Manage Groups',
        groups: groups
    });
}


// ----
// Delete Group
exports.deleteGroup = async ( req, res ) => {

    const group = await Group.findOne({ _id: req.params.group_id });

    if ( !group ) {

        req.flash( 'error', 'There was an error trying to delete the group. Please try again.' );
        res.redirect( 'back' );

    } else {
        await Group.deleteOne({ _id: group._id });
        await Discussion.deleteMany({ _group: group._id });

        await cloudinary.v2.api.delete_resources(group.group_image_id,
            function( error, result ) {
                if ( error ) {
                    req.flash( 'caution', 'Could not delete the group image. Manual deletion is required.' );
                } else {
                    console.log( result );
                }
                
            }
        );
    
        res.redirect( 'back' );
        return;
    }
}