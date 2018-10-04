// Controller Dependencies
const mongoose = require( 'mongoose' );
const ObjectId = require( 'mongodb' ).ObjectId;
const cloudinary = require( 'cloudinary' );
const multer = require( 'multer' );
const jimp = require( 'jimp' );

// Models
const DeadseaUpdate = mongoose.model( 'DeadseaUpdate' );
const Comment = mongoose.model( 'Comment' );
const Reply = mongoose.model( 'Reply' );
const User = mongoose.model( 'User' );

// Multer Options for uploading a single image
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

// Demo JSON data to generate the current progress bar demo
const updates = require( '../demo_data/deadseaUpdates.json' );


// ----
// Get the form for posting a new udate
// -> Queries database for all User documents with role of admin
// -> to allow admins to post for other admins and then render
// -> the form to create a new DeadSea update
exports.newUpdateForm = async ( req, res ) => {
    const users = await User.find( { role: 'admin'} );
    res.render( 'deadseaUpdateForm', { 
        title: 'Post a new update', 
        users 
    });
}
// Using Multer to upload the image
exports.getUpdateImageFile = multer( multerOptions ).single( 'update_image' );
// Optimize the image using Jimp
exports.resizeUpdateImage = async ( req, res, next ) => {
    if ( !req.file ) {
        next();
        return;
    }

    const photo = await jimp.read( req.file.buffer );
    await photo.resize( jimp.AUTO, 800 );
    await photo.quality( 80 );
    const photoMIME = photo.getMIME();

    photo.getBuffer( photoMIME, function( error, result ){
        req.body.updateImageResized = result;
        next();
    });
}
// Uploads image to Cloundinary
exports.uploadUpdateImage = async ( req, res, next ) => {

    if ( !req.file ) {
        next();
    } else {
        cloudinaryOptions = { 
            resource_type: 'image', 
            folder: 'deadsea-updates',
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
                req.body.update_image = result;
                next();
            }
        ).end( req.body.updateImageResized );
    }
}
// SAVES update WITH an image
exports.addUpdateWithImage = async ( req, res ) => {

    const state_of_mind = `${req.body.stateface} ${req.body.statedescription}`;

    const update  = {
        author: ObjectId( req.body.author ),
        text: req.body.update_text,
        image: req.body.update_image.secure_url,
        image_id: req.body.update_image.public_id,
        longitude: req.body.lng,
        latitude: req.body.lat,
        duration: req.body.duration,
        distance: req.body.distance,
        state_of_mind: state_of_mind,
        comments: []
    };

    const newUpdate = new DeadseaUpdate( update );
    await newUpdate.save();

    req.flash( 'success', 'Your post has been sucessfully saved.' );
    res.redirect( '/deadsea-to-everest' );
}
// SAVES image WITHOUT an image
exports.addUpdateWithoutImage = async ( req, res ) => {

    const state_of_mind = `${req.body.stateface} ${req.body.statedescription}`;

    const update  = {
        author: ObjectId( req.body.author ),
        text: req.body.update_text,
        image: '',
        image_id: '',
        longitude: req.body.lng,
        latitude: req.body.lat,
        duration: req.body.duration,
        distance: req.body.distance,
        state_of_mind: state_of_mind,
        comments: []
    };
    
    const newUpdate = new DeadseaUpdate( update );
    await newUpdate.save();

    req.flash( 'success', 'Your post has been sucessfully saved.' );
    res.redirect( '/deadsea-to-everest' );
}


// ----
// Get updates to populate feed
// -> Build the progress bar
// -> Query database for all DeadseaUpdate documents in 
// -> descending order based on the date stored in date_posted
exports.getDeadSeaUpdates = async ( req, res ) => {

    // Keeping old demo data to populate progress bar
    const unformattedStartDate = '01 Jul 2018 00:00:00 EST';
    const startDate = Date.parse( unformattedStartDate ) / 86400000;
    const unformattedEndDate = '29 Aug 2018 00:00:00 EST';
    const endDate = Date.parse( unformattedEndDate ) / 86400000;
    const totalDays = endDate - startDate;
    let updatesProgress = [];
    let lastUpdate = 0;
    let prevColor = 255;
    let prevDate = unformattedStartDate;

    // Progress bar
    [].forEach.call(updates, function(update) {
        let unformattedUpdateDate = update.date_posted;
        let updateDate = Date.parse( unformattedUpdateDate ) / 86400000;
        let daysSinceStart = ( updateDate - startDate );
        let progress = Math.ceil(( daysSinceStart / totalDays ) * 100 );
        let updatePercent = ( progress - lastUpdate );
        let color = ( prevColor - updatePercent );

        let progressUpdate = {
            percent: updatePercent,
            color,
            prevColor,
            prevDate,
            currentDate: unformattedUpdateDate,
            activity: update.activity,
            id: update.id
        }

        updatesProgress.push(progressUpdate);
        prevColor = color;
        lastUpdate = updatePercent;
        prevDate = unformattedUpdateDate;
    });
    // /progress bar 

    const deadseaUpdates = await DeadseaUpdate.find()
        .sort({ date_posted: 'descending' });

    res.render( 'deadsea', {
        pretitle: 'The Journey',
        title: 'Dead Sea to Everest',
        cover: 'https://res.cloudinary.com/dxxnoqykq/image/upload/v1532715453/covers/ce-cover.jpg',
        updates,
        startDate: unformattedStartDate,
        endDate: unformattedEndDate,
        updatesProgress,
        modalContent: 'Subscribe to get the latest updates from Charlie\'s adventure sent right into your inbox!',
        deadseaUpdates
    });
}


// ----
// Get Specific Update By Id
// -> 
exports.getUpdateById = ( req, res ) => {
    //const getIndex = updates.findIndex( x => x.id === req.params.id );
    const getIndex = (req.params.id - 1);
    const update = updates[getIndex];

    // query database

    res.render( 'deadseaUpdate', { 
        title: 'Update Title',
        pretitle: 'The Journey',
        id: update.id,
        content: update.content,
        lat: update.lat,
        lng: update.lng,
        date_posted: update.date_posted,
        activity: update.activity
    });
}


// ----
// Post Comment To Update
// -> Queries database for DeadseaUpdate that has the _id that
// -> matches the URL parameter of :update_id. If it exists then a
// -> comment object is created and then SAVED to the comments array
// -> for the update
exports.postCommentToUpdate = async ( req, res ) => {

    const update = await DeadseaUpdate.findOne({ _id: req.params.update_id });

    if ( !update ) {
        req.flash( 'error', 'Uh oh, an error occured and your comment could not be saved.' );
        res.redirect( 'back' );
    }

    const comment = {
        author: req.user._id,
        post: update._id,
        content: req.body.comment,
        replies: []
    }

    const newComment = new Comment( comment );

    await DeadseaUpdate.findByIdAndUpdate( 
        update._id, 
        { $push: { "comments": newComment }}, 
        { safe: true, new : true }
    );

    req.flash( 'success', 'You successfully posted a comment.' );
    res.redirect( 'back' );
}


// ----
// Post Reply to Update Comment
// -> Queries database for a DeadseaUpdate document that has a comment
// -> with the _id passed as a URL parameter of :comment_id. If it exists,
// -> then a Reply object is created and then passed to the specific comment's
// -> replies array
exports.postReplyToUpdateComment = async ( req, res ) => {
    const comment_id = req.params.comment_id;
    const updateWithComment = await DeadseaUpdate.findOne({ 'comments._id': comment_id });

    if ( !updateWithComment ) {
        req.flash( 'error', `Uh oh, an error occured and your comment reply could not be saved. The comment you tried to search for had an _id of ${req.params.comment_id} ` );
        res.redirect( 'back' );
    }

    const reply = {
        author: req.user._id,
        content: req.body.reply
    }

    const newReply = new Reply( reply );
    
    await DeadseaUpdate.findByIdAndUpdate( 
        { '_id': updateWithComment._id,
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
                { 'comment._id': ObjectId( comment_id ) }
            ]
        }
    );

    req.flash( 'success', 'You successfully posted a reply.' );
    res.redirect( 'back' );    

}