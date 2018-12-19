// Controller Dependencies
const mongoose = require( 'mongoose' );
const ObjectId = require('mongodb').ObjectId;
const cloudinary = require( 'cloudinary' );
const multer = require( 'multer' );
const jimp = require( 'jimp' );

// Models
const Post = mongoose.model( 'Post' );
const Comment = mongoose.model( 'Comment' );
const Reply = mongoose.model( 'Reply' );
const Notification = mongoose.model( 'Notification' );
const User = mongoose.model( 'User' );

// Multer options for uploading a single image
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


// ----
// Create New Post
// -> Get image with Multer
exports.getPostImageFile = multer( multerOptions ).single( 'post_image' );
// -> Optimize image with jimp
exports.resizePostImage = async ( req, res, next ) => {
    if ( !req.file ) {
        next();
        return;
    }

    const photo = await jimp.read( req.file.buffer );
    await photo.resize( jimp.AUTO, 800 );
    await photo.quality( 80 );

    photo.getBuffer( req.file.mimetype, function( error, result ){

        if ( error ) {
            req.flash( 'error', error );
            res.redirect( 'back' );
        }

        req.body.postImageResized = result;
        next();
    });
}
// -> Upload image to Cloudinary
exports.uploadPostImage = async ( req, res, next ) => {

    if ( !req.file ) {
        next();
    } else {
        const cloudinaryOptions = { 
            resource_type: 'image', 
            folder: 'social-app/posts',
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
                req.body.post_image = result;
                next();
            }
        ).end( req.body.postImageResized );
    }
}
// -> Create and save post WITH an image
exports.addPostWithImage = async ( req, res ) => {

    const post  = {
        author: req.user._id,
        post_content: req.body.post_content,
        post_image: req.body.post_image.secure_url,
        post_image_id: req.body.post_image.public_id,
        comments: []
    };

    const newPost = new Post( post );

    await newPost.save(function( error, result ) {
        if ( error ) {
            console.log( error );
            req.flash( 'error', 'There was an issue saving your post. Please try again...' );
            res.redirect( '/' );
            return;
        } else {
            console.log( result );
            req.flash( 'success', 'Your post has been sucessfully saved.' );
            res.redirect( 'back' );
        }
    });

}
// -> Create and save post WITHOUT image
exports.addPostWithoutImage = async ( req, res ) => {

    const post  = {
        author: req.user._id,
        post_content: req.body.post_content,
        post_image: '',
        post_image_id: '',
        comments: []
    };
    
    const newPost = new Post( post );
    await newPost.save(function( error, result ) {
        if ( error ) {
            console.log( error );
            req.flash( 'error', 'There was an issue saving your post. Please try again...' );
            res.redirect( '/' );
            return;
        } else {
            console.log( result );
            req.flash( 'success', 'Your post has been sucessfully saved.' );
            res.redirect( 'back' );
        }
    });

}


// ----
// Post Comment To Post
// -> Query database to find a Post document that has the _id
// -> property that matches the :post_id URL parameter.
// -> If a Post document exists, create the Comment object
// -> and push it to the comments array for that Post
exports.postCommentToPost = async ( req, res ) => {

    const post = await Post.findOne({ _id: req.params.post_id });

    if ( !post ) {
        req.flash( 'error', 'Uh oh, an error occured and your comment could not be saved.' );
        res.redirect( 'back' );
    }

    const comment = {
        author: req.user._id,
        post: post._id,
        content: req.body.comment,
        replies: []
    }

    const newComment = new Comment( comment );

    await Post.findByIdAndUpdate( 
        post._id, 
        { $push: { "comments": newComment }}, 
        { safe: true, new : true }
    );

    if ( comment.author != post.author ) {
        const notification = {
            action: 'commented on',
            actor: req.user._id,
            medium: 'post',
            medium_ref: post._id,
            medium_owner: ObjectId( post.author ),
            notify: ObjectId( post.author )
        }

        const newNotification = new Notification( notification );
        await newNotification.save();
    }

    req.flash( 'success', `You successfully posted a comment to ${post.author.name}'s post.` );
    res.redirect( 'back' );
}


// ----
// Post Reply to Comment
// -> Queries the database for a post that contains a comment with
// -> the _id that matches the :comment_id URL parameter
// -> If found, then create the Reply object and push it to the
// -> replies array for that specific comment inside the comment 
// -> array for the post
exports.postReplyToComment = async ( req, res ) => {
    const comment_id = req.params.comment_id;
    const postWithComment = await Post.findOne({ 'comments._id': comment_id });

    if ( !postWithComment ) {
        req.flash( 'error', `Uh oh, an error occured and your comment reply could not be saved. The comment you tried to search for had an _id of ${req.params.comment_id} ` );
        res.redirect( 'back' );
    }

    const reply = {
        author: req.user._id,
        content: req.body.reply
    }

    const newReply = new Reply( reply );
    
    await Post.findByIdAndUpdate( 
        { '_id': postWithComment._id,
            'comments': {
                '$elemMatch': {
                    'comments._id': comment_id
                }
            }
        },
        {
            '$push': { 
                'comments.$[comment].replies': newReply  
            }
        },
        {
            "safe": true,
            "new": true,
            "arrayFilters": [
                { 'comment._id': ObjectId(comment_id) }
            ]
        }
    );

    // --- Creating and saving notification for the reply
    let comment_author;
    await Post.findOne({ '_id': postWithComment._id }, function( error, post ) {

        if ( error ) {
            req.flash( 'error', error );
            res.redirect( 'back' );
        }

        comment_author = post.comments.id( comment_id ).author;
    });

    if ( reply.author != postWithComment.author && reply.author != comment_author ) {
        const replyNotification = {
            action: 'replied to',
            actor: req.user._id,
            medium: 'comment',
            medium_ref: ObjectId( comment_id ),
            medium_owner: ObjectId( postWithComment.author ),
            notify: ObjectId( comment_author )
        }

        const newReplyNotification = new Notification( replyNotification );
        await newReplyNotification.save()

    }
    // Creating and saving notification for post owner
    if ( reply.author != postWithComment.author ) {
        const notification = {
            action: 'commented on',
            actor: req.user._id,
            medium: 'post',
            medium_ref: ObjectId( postWithComment._id ),
            medium_owner: ObjectId( postWithComment.author ),
            notify: ObjectId( postWithComment.author )
        }

        const newNotification = new Notification( notification );
        await newNotification.save();

        const notifier = { seen_notifications: false }
        const userToNotify = await User.findOneAndUpdate(
            { _id: ObjectId(postWithComment.author) },
            { $set: notifier },
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        );
    }

    req.flash( 'success', 'You successfully posted a reply.' );
    res.redirect( 'back' );    
}


// ----
// Delete Post
// -> Queries the database for a Post document that has an _id
// -> that matches the :post_id URL parameter.
// -> If it exists, then get it's post_image_id and, delete the Post
// -> and deletes the image from Cloudinary
exports.deletePostById = async ( req, res ) => {

    const the_post = await Post.findById( req.params.post_id );

    if ( the_post ) {
    
        const image_id = the_post.post_image_id;

        await Post.findOneAndDelete({ _id: the_post });

        await cloudinary.v2.api.delete_resources(image_id,
            function( error, result ) {
                if ( error) {
                    req.flash( 'error', error );
                    res.redirect( 'back' );
                }

                console.log(result);
            }
        );

        req.flash( 'success', 'Your post was successfully deleted.' );
        res.redirect( 'back' );

    } else {

        req.flash( 'error', 'Sorry, the post could not be deleted at this time. Please try again later.' );
        res.redirect( 'back' );

    }
}


// ----
// Report Post
// -> Queries the database for a Post document that has an _id
// -> that matches the :post_id URL parameter.
// -> If found, then determined if Post has is_reported of TRUE
// -> and if set to FALSE then set it to TRUE
exports.reportPostById = async ( req, res ) => {
    const post = await Post.findById( req.params.post_id );

    if ( !post ) {
        req.flash( 'error', 'Uh oh. Something happened when attempting to report this post. Please try again.' );
        res.redirect( 'back' );
    }

    const post_reports = post.reports;

    if ( post_reports.reported_by.indexOf( req.user._id ) === -1 || !post.reports ) {
        post_reports.is_reported = true;
        post_reports.reported_by.push( ObjectId( req.user._id ) );

        await Post.findByIdAndUpdate( post._id, {
            reports: post_reports
        });

        req.flash( 'success', 'Thanks for reporting this post. We will look into it as soon as we can.' );
        res.redirect( 'back' );
    }
}


// ----
// Mark Post As Safe
// -> Queries database to find a Post document that has an _id that
// -> matches the :post_id URL parameter. If found, then set it's
// -> is_reported to FALSE
exports.markPostAsSafe = async ( req, res ) => {
    const post = await Post.findById( req.params.post_id );

    if ( !post ) {
        req.flash( 'error', 'Uh oh. Something happened when attempting to mark this post as safe. Please try again.' );
        res.redirect( 'back' );
    }

    const post_reports = post.reports;

    post_reports.is_reported = false;
    post_reports.reported_by = [];

    await Post.findByIdAndUpdate( post._id, {
        reports: post_reports
    });

    req.flash( 'success', 'This post has now been marked safe.' );
    res.redirect( 'back' );
    
}

// ----
// Like Post
// -> Queries the database for a Post document that matches the :post_id
// -> URL parameter with it's _id property. Then cheks the likes array to
// -> see if it contains the users _id and if not then adds it.
exports.likePost = async ( req, res) => {
    const post = await Post.findOne({ _id: req.params.post_id });

    if ( post.likes.indexOf( req.user._id ) === -1 ) {

        const likedPost = await Post.findByIdAndUpdate( 
            post._id, 
            { $push: { "likes": req.user._id }}, 
            { safe: true, new : true }
        );

        const notification = {
            action: 'liked your',
            actor: req.user._id,
            medium: 'post',
            medium_ref: post._id,
            medium_owner: ObjectId( post.author ),
            notify: ObjectId( post.author )
        }

        const newNotification = new Notification( notification );
        await newNotification.save();

        const notifier = { seen_notifications: false }
        const userToNotify = await User.findOneAndUpdate(
            { _id: ObjectId(post.author) },
            { $set: notifier },
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        );

        res.json( likedPost );

    } else {
        req.flash( 'error', 'Uh oh. An error occured. If this continues please contact us and we\'ll look into it.' );
        res.redirect( 'back' );
    }
}


// ---- 
// Unlike Post
// -> Queries the database for a Post document that matches the :post_id
// -> URL parameter with it's _id and if the users _id matches one
// -> within the likes array to then remove it.
exports.unlikePost = async ( req, res ) => {
    const post = await Post.findOne({ _id: req.params.post_id });

    if ( post.likes.indexOf(req.user._id) === -1 ) {

        req.flash( 'error', 'Uh oh. An error occured. If this continues please contact us and we\'ll look into it.' );
        res.redirect( 'back' );

    } else {

        const unlikedPost = await Post.findByIdAndUpdate( 
            post._id, 
            { $pull: { "likes": req.user._id }}, 
            { safe: true, new : true }
        );

        res.json( unlikedPost );

    }
}