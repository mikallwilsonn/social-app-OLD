const express = require( 'express' );
const router = express.Router();
const { catchErrors } = require( '../handlers/errorHandlers' );


// ----
// Get Controllers
const homeController = require( '../controllers/homeController' );
const authController = require( '../controllers/authController' );
const userController = require( '../controllers/userController' );
const postController = require( '../controllers/postController' );
const adminController = require( '../controllers/adminController' );

// Use devController.postDump on any POST request to test what data is being passed to the database before actually doing so
const devController = require( '../controllers/devController' );
router.get( '/dev', devController.postDump );


//
// ----------------
// Main User Routes
// --------


// ----
// Notifications
// 
// Clear Notifications
router.post( '/clear_notifications', userController.clearNotifications );

// Mark Notifications as seen
router.post( '/mark_notifications_as_seen', userController.markNotificationsAsSeen );


// ----
// Home / Front Page
//
// Recent Activity
router.get( '/', 
    authController.isLoggedIn,
    homeController.recentActivity 
);


// ----
// Current User Profile
//
// Get currently logged in users profile
router.get( '/my-profile', 
    authController.isLoggedIn,
    homeController.myProfile
);


// ----
// User
//
// GET form for registerring a new user
router.get( '/register', userController.registerForm );

// Check the data passed through the form then create and SAVE new user
router.post( '/register', 
    userController.validateRegister,
    authController.registerDoesEmailExist,
    authController.registerDoesUsernameExist,
    userController.registerNewUser,
    userController.loginForm 
);

// GET the user login form
router.get( '/login', userController.loginForm );

// LOGIN user with the credentials passed through login form
router.post( '/login', 
    authController.checkForSuspension,
    authController.login 
);

// GET Password recovery form
router.get( '/forgot', userController.forgotPasswordForm );

// SUBMIT the password recovery form and send recovery link
router.post( '/forgot', catchErrors( authController.recoverPassword ));

// GET form to enter new password
router.get( '/reset/:token', catchErrors( authController.resetPassword ));

// Submit new password to be SAVED for user
router.post( '/reset/:token',
    authController.confirmPasswordReset,
    catchErrors( authController.updatePassword )
);

// Update new email for user
router.get( '/change-email/:token', userController.updateEmail );


// LOGOUT the currently logged in user
router.get( '/logout', authController.logout );

// GET the settings for the currently logged in user
router.get( '/settings', 
    authController.isLoggedIn,
    userController.settings 
);

// FOLLOW a user
router.post( '/follow_user=:user_id', userController.followUser );

// UNFOLLOW a user
router.post( '/unfollow_user=:user_id', userController.unfollowUser );

// Redirect for users who log in first time to create their profile
router.get( '/welcome', userController.settingsProfile );

// GET profile settings form
router.get( '/settings/profile', 
    authController.isLoggedIn,
    userController.settingsProfile 
);

// SAVE update profile settings
router.post( '/settings/profile', 
    authController.updateDoesEmailExist,
    authController.updateDoesUsernameExist,
    userController.checkEmailChange,
    catchErrors( userController.updateProfileInfo )
);

// GET avatar update form
router.get( '/settings/avatar', 
    authController.isLoggedIn,
    userController.settingsAvatar
);

// Optimize, upload, and SAVE new user avatar
router.post( '/settings/avatar', 
    userController.getAvatarFile,
    userController.resizeAvatarFile, 
    catchErrors( userController.uploadAvatar ),
    catchErrors( userController.saveNewAvatar )
);

// GET Profile cover form
router.get( '/settings/profile-cover', 
    authController.isLoggedIn,
    userController.settingsProfileCover  
);

// Optimize, upload, and SAVE new profile cover
router.post( '/settings/profile-cover', 
    userController.getProfileCoverFile,
    userController.resizeProfileCoverFile,
    catchErrors( userController.uploadProfileCover ),
    catchErrors( userController.saveNewProfileCover )
);


// GET Manage Password form
router.get( '/settings/manage-password', 
    authController.isLoggedIn,
    userController.settingsPassword 
);

// SAVE new password for currently logged in user
router.post( '/settings/manage-password', catchErrors( userController.updatePassword ));


// GET all users
router.get( '/users', 
    authController.isLoggedIn,
    userController.getUsers 
);

// Search for users by term
router.post( '/users', 
    authController.isLoggedIn,
    userController.searchUsers 
);

// GET specified page of users
router.get( '/users/page/:page',     
    authController.isLoggedIn,
    catchErrors( userController.getUsers )
);

// GET user profile by username
router.get( '/users/@:username', 
    authController.isLoggedIn, 
    userController.getProfileByUsername 
);

// GET list of users that a specific user is FOLLOWING
router.get('/users/@:username/following',     
    authController.isLoggedIn, 
    userController.getProfileFollowing
);

// GET list of users that a specific user is FOLLOWED by
router.get('/users/@:username/followers',     
    authController.isLoggedIn, 
    userController.getProfileFollowers
);

// View full post, including comments
router.get( '/users/@:username/post=:post_id', userController.viewFullPost );

// CREATE a post WITH an image
router.post( '/create-new-post-with-image', 
    postController.getPostImageFile,
    postController.resizePostImage,
    postController.uploadPostImage,
    catchErrors( postController.addPostWithImage ) 
);

// CREATE post WITHOUT image
router.post( '/create-new-post', catchErrors( postController.addPostWithoutImage ));

// CREATE comment to a specific post
router.post( '/postcommenttopost=:post_id', postController.postCommentToPost );

// CREATE reply to comment on a specific post
router.post( '/postreplytocomment=:comment_id', postController.postReplyToComment );

// DELETE a specific post
router.post( '/delete_post=:post_id', postController.deletePostById );

// Report a specific post for review by admins
router.post( '/report_post=:post_id', postController.reportPostById );

// Mark post as safe and remove the report
router.post( '/mark_post_as_safe=:post_id', postController.markPostAsSafe );

// LIKE a specific post
router.post( '/like_post=:post_id', postController.likePost );

// If liked, UNLIKE a specific post
router.post( '/unlike_post=:post_id', postController.unlikePost );


//
// ----------------
// Admin Routes
// --------


// ----
// Manage Posts
//
// Get Reported Posts
router.get( '/admin/reported-posts', adminController.getReportedPosts );


// ----
// Manage Users
//
// Get users
router.get( '/admin', adminController.getUsers );
router.get( '/admin/manage-users', adminController.getUsers );
router.get( '/admin/manage-suspended-users', adminController.getSuspendedUsers );

// GET form to edit user account
router.get( '/admin/edit_user=:user_id', adminController.editUser );

// UPDATE user account
router.post( '/admin/edit_user=:user_id', adminController.updateUser );

// SUSPEND user account
router.post( '/admin/suspend_user=:user_id', adminController.suspendUser );

// REVOKE suspension for a user account
router.post( '/admin/unsuspend_user=:user_id', adminController.unsuspendUser );

// DELETE a user account
router.post( '/admin/delete_user=:user_id', adminController.deleteUser );


module.exports = router;
