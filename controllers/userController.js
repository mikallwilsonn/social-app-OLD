// Controller Dependencies
const helpers = require( '../helpers.js' );
const mail = require( '../handlers/mail' );
const countries = require( 'countries-list' );
const moment = require( 'moment' );
const mongoose = require( 'mongoose' );
const ObjectId = require( 'mongodb' ).ObjectId;
const promisify = require( 'es6-promisify' );
const crypto = require( 'crypto' );
const cloudinary = require( 'cloudinary' );
const multer = require( 'multer' );
const jimp = require( 'jimp' );
const uuidv5 = require( 'uuid/v5' );

// Models
const User = mongoose.model( 'User' );
const Post = mongoose.model( 'Post' );
const Notification = mongoose.model( 'Notification' );
const AccountInvite = mongoose.model( 'AccountInvite' );

// Multer options for uploading an image
const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter: ( req, file, next ) => {
        const isPhoto = file.mimetype.startsWith('image/');
        if( isPhoto ) {
            next( null, true);
        } else {
            next( {message: 'That filetype isn\'t allowed!'}, false );
        }
    }
};

var storage = multer.memoryStorage(); 
var upload = multer({ storage: storage })


// ----
// Show Login Form
exports.loginForm = ( req, res ) => {
    res.render( 'login', { title: 'Login' });
};


// ----
// Login Success Online Status Change
exports.loginSuccessOnlineStatus = async ( req, res ) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { online: true }},
        {
            new: true,
            runValidators: true,
            context: 'query'
        }
    );
    res.redirect( '/' );
}


// ----
// Show Register Form
exports.registerForm = ( req, res ) => {
    res.render( 'register', { title: 'Create Your Account' });
}


// ----
// Show forgot Password form
exports.forgotPasswordForm = ( req, res ) => {
    res.render( 'forgot', { title: 'Forgot My Password' });
}


// ----
// Create an Invite Request
exports.createInviteRequest = async ( req, res ) => {
    const user_exists_check = await User.findOne({ email: req.body.email  });

    if ( !user_exists_check ) {

        const invite_check = await AccountInvite.findOne({ email: req.body.email });

        if ( !invite_check ) {

            const invite = {
                key: '',
                email: req.body.email,
                request: true
            }

            const newAccountInvite = new AccountInvite( invite );
            await newAccountInvite.save();

            req.flash( 'success', 'You successfully submitted your request for an invite. You will be notified by email if your request has been accepted.' );
            res.redirect( 'back' );
            return;
        } else {
            req.flash( 'error', `There is already a user or a pending request for a user with that email: ${req.body.email}` );
            res.redirect( 'back' );
            return;
        }
    } else {
        req.flash( 'error', `There is already a user or a pending request for a user with that email: ${req.body.email}` );
        res.redirect( 'back' );
        return;
    }
}


// ----
// Checks to make sure the invite key and associated email exist
exports.hasValidInviteKey = async ( req, res, next ) => {
    const inviteCheck = await AccountInvite.findOne({
        key: req.body.key,
        email: req.body.email
    });

    if ( !inviteCheck ) {
        req.flash( 'error', 'Sorry, but looks like the invite key or the email you provided is not valid. Please check and try again.' );
        res.render( 'register', {
            title: 'Register',
            body: req.body,
            flashes: req.flash()
        });
    } else {
        next();
    }
}


// ----
// Validate User Registation data
exports.validateRegister = ( req, res, next ) => {
    req.sanitizeBody( 'body' );
    req.checkBody( 'name', 'You must supply a name.' ).notEmpty();
    req.checkBody( 'username', 'You must supply a username.' ).notEmpty();
    req.checkBody( 'email', 'Please provide a valid email.' ).isEmail();
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    });
    req.checkBody( 'password', 'A password must be provided to create an account' ).notEmpty();
    req.checkBody( 'password-confirm', 'You must confirm your password.' ).notEmpty();
    req.checkBody( 'password-confirm', 'Your passwords do not match. Please try again.' ).equals( req.body.password );

    const errors = req.validationErrors();
    if ( errors ) {
        req.flash( 'error', errors.map( err => err.msg ) );
        res.render( 'register', { body: req.body, flashes: req.flash() });
        return;
    }
    next();
}


// ----
// Register User 
// -> Takes all data provided in the form and saves a new user account
exports.registerNewUser = async ( req, res ) => {
    const user = new User({
        role: 'member',
        email: req.body.email,
        name: req.body.name,
        username: req.body.username,
        profile: {
            bio: '',
            location: '',
            gender: '',
            occupation: '',
            relationship_status: '',
            sexual_orientation: '',
            religion: '',
            politics: ''
        },
        contact: {
            website: '',
            email: '',
            phone: ''
        }, 
        avatar: '/images/defaultAvatar.jpg',
        avatar_id: '',
        profile_cover: '/images/defaultPofileCover.jpg',
        profile_cover_id: '',
        joined_at: Date.now(),
        public: true
    });

    const register = promisify( User.register, User );
    await register( user, req.body.password );

    await AccountInvite.deleteOne({ key: req.body.key, email: req.body.email  });
    
    req.flash( 'success', 'Your account has been created! Please login with your email and password.');
    res.redirect( '/login' );
}


// ----
// Display all users
// -> Queries the database for all User documents that have a 
// -> public property of TRUE and sorts them into groups of 6 for pagination
exports.getUsers = async ( req, res ) => {
    const page = req.params.page || 1;    
    const limit = 6;
    const skip = ( page * limit ) - limit;

    const usersPromise = await User
        .find({ public: true })
        .skip( skip )
        .limit( limit )
        .sort({ name: 'asc' }
    );

    const countPromise = User.countDocuments();

    const [ users, count ] = await Promise.all([ usersPromise, countPromise ]);

    const pages = Math.ceil( count / limit );

    let nextPage;
    let prevPage;

    if ( page < pages ) {
        nextPage = parseFloat(page) + 1;
    } else {
        nextPage = false;
    }

    if ( page > 1 ) {
        prevPage = parseFloat(page) - 1;
    } else {
        prevPage = false;
    }

    // If page requested does not exist then return to the last possible page #
    if ( !users.length && skip ) {
        req.flash( 'notice', `Hey! You requested page ${page}. But, that doesn't exists. Here is the final page currently available: Page ${pages}` );
        res.redirect( `/users/page/${pages}` );
        return;
    }

    res.render( 'users', { 
        title: 'Community',
        users: users,
        page: page,
        pages: pages,
        count: count,
        nextPage: nextPage,
        prevPage: prevPage
    });   
}

// ----
// Search Users
// -> Queries the database for any User documents with the name or 
// -> username properties that match the term passed
exports.searchUsers = async ( req, res ) => {

    const users = await User.find({ 
        $text: {
            $search: req.body.search
        }
    }, {
        score: { $meta: 'textScore' }
    })
    .sort({
        score: { $meta: 'textScore' }
    }).limit( 10 );

    res.render( 'users', { 
        title: 'Community',
        users: users,
        query: req.body.search
    });   
}


// ----
// Get Profile page by username
// -> Checks if the username is the same as the current user and if so
// -> then redirects to their profile, otherwise queries the database for
// -> a User document with the username property that matches the :username
// -> URL parameter
exports.getProfileByUsername = async ( req, res ) => {
    if ( req.user.username == req.params.username ) {
        res.redirect( '/my-profile' );
    } else {
        const profile = await User.findOne( { username: req.params.username } );

        if ( profile.public == false ) {
            req.flash( 'error', `The profile for @${profile.username} either could not be found or has their privacy settings set to private.` );
            res.redirect( '/' );
        }

        const posts = await Post.find( { author: profile._id })
            .sort({ date_posted: 'descending' });

        let email;

        if ( profile.contact.email === true ) {
            email = profile.email;
        } else {
            email = '';
        }

        res.render( 'profile', {
            username: profile.username,
            profile_id: profile._id,
            avatar: profile.avatar,
            profile_cover: profile.profile_cover,
            title: profile.name,
            email: email,
            contact: profile.contact,
            joined_at: profile.joined_at,
            profile: profile.profile,
            posts: posts,
            postControls: false,
            followers: profile.followers,
            role: profile.role,
        });
    }
}


// Get Profile Following
// -> Queries the database for all User documents from the array of
// -> _id's in the users following array
exports.getProfileFollowing = async ( req, res ) => {
    const profile = await User.findOne({ username: req.params.username });

    const users = await User.find({ 
        '_id': {
            $in: profile.following
        },
        public: true
    });

    res.render( 'profile-follows', {
        username: profile.username,
        profile_id: profile._id,
        avatar: profile.avatar,
        profile_cover: profile.profile_cover,
        title: profile.name,
        users,
        followers: profile.followers,
        profileFollowers: false,
        profileFollowing: true
    });
}


// Get Profile Followers
// -> Queries the database for all User documents from the array of
// -> _id's in the users followers array
exports.getProfileFollowers = async ( req, res ) => {
    const profile = await User.findOne({ username: req.params.username });

    if ( !profile ) {
        req.flash( 'error', 'Uh oh. This accounts followers could not be loaded at this time.' );
        res.redirect( 'back' );
    }

    const users = await User.find({ 
        '_id': {
            $in: profile.followers
        },
        public: true
    });

    res.render( 'profile-follows', {
        username: profile.username,
        profile_id: profile._id,
        avatar: profile.avatar,
        profile_cover: profile.profile_cover,
        title: profile.name,
        users,
        followers: profile.followers,
        profileFollowers: true,
        profileFollowing: false
    });
}



// ----
// View Full Post
// -> Queries the database for a User document that matches the :username
// -> URL parameter with it's username property. If one exists, then to
// -> query for the Post document that matches the _id with the :post_id
// -> URL parameter
exports.viewFullPost = async ( req, res ) => {

    const profile = await User.findOne( { username: req.params.username } );

    if ( !profile ) {
        req.flash( 'error', 'Sorry, there was an error loading the post you requested.' );
        res.redirect( 'back' );
    }

    const post = await Post.findOne( { _id: req.params.post_id, author: profile._id });

    if ( !post ) {
        req.flash( 'error', 'Sorry, there was an error loading the post you requested.' );
        res.redirect( 'back' );
    }

    let email;

    if ( profile.contact.email === true ) {
        email = profile.email;
    } else {
        email = '';
    }

    res.render( 'profile-post', {
        username: profile.username,
        avatar: profile.avatar,
        profile_id: profile._id,
        profile_cover: profile.profile_cover,
        title: profile.name,
        email: email,
        contact: profile.contact,
        joined_at: profile.joined_at,
        profile: profile.profile,
        post: post,
        comments: post.comments,
        postControls: false,
        followers: profile.followers
    });
}


// ----
// Settings : Profile
exports.settings = ( req, res ) => {
    res.redirect( '/settings/profile' );
}

exports.settingsProfile = ( req, res ) => {
    res.render( 'settings-profile', { 
        title: 'Edit Profile',
        countries: countries 
    });
}

// Check if user has changed email, then sends an email to confirm
exports.checkEmailChange = async ( req, res, next ) => {
    if ( req.user.email === req.body.email ) {
        req.changeEmailToken = '';
        req.changeEmailExpires = null;
        req.new_email = '';
        next();
    } else {
        req.changeEmailToken = crypto.randomBytes( 20 ).toString( 'hex' );
        req.changeEmailExpires = Date.now() + 3600000;
        req.new_email = req.body.email;
        req.checkBody( 'new_email', 'Please provide a valid email.' ).isEmail();
        req.sanitizeBody('new_email').normalizeEmail({
            remove_dots: false,
            remove_extension: false,
            gmail_remove_subaddress: false
        });
        next();
    }
}

// Update user account information with data passed through form
exports.updateProfileInfo = async ( req, res ) => {

    let birthday = moment( req.body.birthday ).format( 'Y-M-D' );
    birthday = birthday + ' 00:00:00.000';

    let public;

    if ( req.body.privacy ) {
        public = true;
    } else {
        public = false;
    }

    let email_privacy;

    if ( req.body.email_privacy ) {
        email_privacy =  true;
    } else {
        email_privacy = false;
    }

    const updates = {
        name: req.body.name,
        profile: {
            bio: req.body.profile,
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
        public: public,
        changeEmailToken: req.changeEmailToken,
        changeEmailExpires: req.changeEmailExpires,
        new_email: req.new_email
    }

    const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $set: updates },
        {
            new: true,
            runValidators: true,
            context: 'query'
        }, function( error ) {
            if ( error ) {
                req.flash('error', `Uh oh. Something happened and your profile updates could not be saved. Please try again... ERROR: ${error}`);
                res.redirect( 'back' );
            }
        }
    );

    req.flash( 'success', 'Your Profile and/or Account Settings have been updated.' );
    res.redirect( '/settings' );
}


// ----
// Update Email
exports.updateEmail = async ( req, res ) => {
    const user = await User.findOne({
        changeEmailToken: req.params.token,
        changeEmailExpires: { $gt: Date.now() }
    });

    if ( !user ) {
        req.flash( 'error', 'Email change is invalid or has expired.' );
        res.redirect( '/login' );
    }

    const updates = {
        email: user.new_email,
        changeEmailToken: '',
        changeEmailExpires: '',
        new_email: ''
    }

    const update_user = await User.findOneAndUpdate(
        { _id: user._id },
        { $set: updates },
        {
            new: true,
            runValidators: true,
            context: 'query'
        }, function( error, success ) {
            if ( error ) {
                console.log( error );
                req.flash( 'error', 'Uh oh. An error occured while trying to update your email. Please try again...' );
                res.redirect( '/login' );
            } 
            console.log( success );
        }
    );

    if ( req.user ) {

        req.logout();
        req.flash( 'success', 'Your account email has been successfully updated. Please log in now.');
        res.redirect( '/login' );

    } else {

        req.flash( 'success', 'Your account email has been successfully updated. Please log in now.' );
        res.redirect( '/login' );

    }
}


// ----
// Settings : Avatar
exports.settingsAvatar = ( req, res ) => {
    res.render( 'settings-avatar' );
}
// Get the file
exports.getAvatarFile = multer( multerOptions ).single( 'avatar' );
// Resize using JIMP
exports.resizeAvatarFile = async ( req, res, next ) => {
    if ( !req.file ) {
        next();
        return;
    }

    const photo = await jimp.read( req.file.buffer );
    await photo.cover( 500, 500 );
    await photo.quality( 80 );
    const photoMIME = photo.getMIME();

    photo.getBuffer( photoMIME, function( error, result ){
        if ( error ) {
            req.flash( 'error', error );
            res.redirect( 'back' );
        }
        req.body.avatarResized = result;
        next();
    });
}
// Upload to Cloudinary
exports.uploadAvatar = async ( req, res, next ) => {

    cloudinaryOptions = { 
        resource_type: 'image', 
        folder: 'social-app/users/avatars',
        use_filename: true,
        unique_filename: true 
    }

    await cloudinary.v2.uploader.upload_stream( cloudinaryOptions,
        function( error, result ) {

            if ( error ) {
                req.flash( 'error', error );
                res.redirect( 'back');
                return;
            } 
            cloudinary.v2.api.delete_resources(req.user.avatar_id,
                function(error, result){console.log(result);}
            );
            req.body.avatarUpload = result;
            next();
        }
    ).end( req.body.avatarResized );
}
// Save to database: 1- a url to access it and 2- an id to delete it when a new image is uploaded
exports.saveNewAvatar = async ( req, res ) => {

    const updates = {
        avatar: req.body.avatarUpload.secure_url,
        avatar_id: req.body.avatarUpload.public_id
    }

    const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $set: updates },
        {
            new: true,
            runValidators: true,
            context: 'query'
        }
    );

    req.flash( 'success', 'Your Account Avatar has been updated.' );
    res.redirect( 'back' );
} 


// ----
// Settings : Profile Cover
exports.settingsProfileCover = ( req, res ) => {
    res.render( 'settings-profile-cover' );
}
// Get The file
exports.getProfileCoverFile = multer( multerOptions ).single( 'profile_cover' );
// Resize with jimp
exports.resizeProfileCoverFile = async ( req, res, next ) => {
    if ( !req.file ) {
        next();
        return;
    }

    const photo = await jimp.read( req.file.buffer );
    await photo.cover( 1600, 900 );
    await photo.quality( 80 );
    const photoMIME = photo.getMIME();

    photo.getBuffer( photoMIME, function( error, result ){
        if ( error ) {
            req.flash( 'error', error );
            res.redirect( 'back' );
        }
        req.body.profileCoverResized = result;
        next();
    });
}
// Upload to Cloudinary
exports.uploadProfileCover = async( req, res, next ) => {
    cloudinaryOptions = { 
        resource_type: 'image', 
        folder: 'social-app/users/profile-covers',
        use_filename: true,
        unique_filename: true 
    }
    
    await cloudinary.v2.uploader.upload_stream( cloudinaryOptions,
        function( error, result ) {
            if ( error ) {
                req.flash( 'error', error );
                res.redirect( 'back');
                return;
            } 
            cloudinary.v2.api.delete_resources(req.user.profile_cover_id,
                function(error, result){console.log(result);}
            );
            req.body.profileCoverUpload = result;
            next();
        }
    ).end( req.body.profileCoverResized ); 
}
// Save to database: 1- a url to access it and 2- an id to delete it when a new image is uploaded
exports.saveNewProfileCover = async ( req, res ) => {

    const updates = {
        profile_cover: req.body.profileCoverUpload.secure_url,
        profile_cover_id: req.body.profileCoverUpload.public_id
    }

    console.log( updates );

    const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $set: updates },
        {
            new: true,
            runValidators: true,
            context: 'query'
        }
    );

    req.flash( 'success', 'Your Profile Cover has been updated.' );
    res.redirect( 'back' );
} 


// ----
// Settings : Password
exports.settingsPassword = ( req, res ) => {
    res.render( 'settings-password' );
}

exports.updatePassword = async ( req, res ) => {

    const user = req.user;
    const setPassword = promisify( user.setPassword, user );
    await setPassword( req.body.password );
    await user.save();

    req.flash( 'success', 'Your password has been updated.' );
    res.redirect( 'back' );
}


// ----
// Clear Notifications
exports.clearNotifications = async ( req, res ) => {

    await Notification.deleteMany( { notify: req.user._id } );

    res.redirect( 'back' );

}


// ----
// Seen Notifications
exports.markNotificationsAsSeen = async ( req, res ) => {

    const notifier = { seen_notifications: true }
    const userToNotify = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $set: notifier },
        {
            new: true,
            runValidators: true,
            context: 'query'
        }
    );

    res.json( userToNotify );
}


// ----
// Follow User
exports.followUser = async ( req, res ) => {
    const user = await User.findOne({ _id: req.params.user_id });

    if ( !user ) {
        req.flash( 'error', 'Uh oh. Following this user was unsuccessful. Please try again.' );
        res.redirect( 'back' );
    }

    if ( user.followers.indexOf( req.user._id ) === -1 ) {

        const follower = await User.findByIdAndUpdate( 
            req.user._id, 
            { $push: { "following": user._id }}, 
            { safe: true, new : true }
        );

        const followed = await User.findByIdAndUpdate( 
            user._id, 
            { $push: { "followers": req.user._id }}, 
            { safe: true, new : true }
        );

        const notification = {
            action: 'followed ',
            actor: req.user._id,
            medium: 'profile',
            medium_ref: user._id,
            medium_owner: user._id,
            notify: user._id 
        }

        const newNotification = new Notification( notification );
        await newNotification.save();

        const notifier = { seen_notifications: false }
        const userToNotify = await User.findOneAndUpdate(
            { _id: user._id },
            { $set: notifier },
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        );

        req.flash( 'success', `You are now following ${user.name}!`);
        res.redirect( 'back' );
    }
}


// ---- 
// Unfollow User
exports.unfollowUser = async ( req, res ) => {
    const profile = await User.findOne({ _id: req.params.user_id });

    if ( !profile ) {
        req.flash( 'error', 'Uh oh. Unfollowing this user was unsuccessful. Please try again.' );
        res.redirect( 'back' );
    }

    if ( req.user.following.indexOf( profile._id ) === -1 ) {

        req.flash( 'error', 'Uh oh. An error occured. If this continues please contact us and we\'ll look into it.' );
        res.redirect( 'back' );

    } else {

        const unfollowing = await User.findByIdAndUpdate( 
            req.user._id, 
            { $pull: { "following": profile._id }}, 
            { safe: true, new : true }
        );

        const unfollowed = await User.findByIdAndUpdate( 
            profile._id, 
            { $pull: { "followers": req.user._id }}, 
            { safe: true, new : true }
        );

        req.flash( 'notice', `You have unfollowed ${profile.name}.`);
        res.redirect( 'back' );
    }
}


// ----
// Change Current Users's Online Status
exports.onlineStatus = async ( req, res ) => {
    let status;
    let state;

    if ( req.user.online === true ) {
        status = false;
        state = 'offline';

    } else {
        status = true;
        state = 'online';
    }

    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { online: status }},
        {
            new: true,
            runValidators: true,
            context: 'query'
        }
    );

    req.flash( 'success', `You are now appearing ${state}.` );
    res.redirect( 'back' );
}

