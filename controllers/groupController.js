// Controller Dependencies
const mongoose = require( 'mongoose' );
const ObjectId = require('mongodb').ObjectId;
const cloudinary = require( 'cloudinary' );
const multer = require( 'multer' );
const jimp = require( 'jimp' );

// Models
const User = mongoose.model( 'User' );
const Group = mongoose.model( 'Group' );

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
// Get Groups
exports.getGroups = async ( req, res ) => {
    const groups = await Group.find({ private: false });

    res.render( 'groups', {
        title: 'Groups',
        groups: groups
    });
}

// ----
// Get New Group Form
exports.newGroup = ( req, res ) => {
    res.render( 'group-form',  {
        title: 'Create New Group'
    });
}


// ----
// Create and Save New Group

// Get Image file
exports.getGroupImageFile = multer( multerOptions ).single( 'photo' );
// Resize image
exports.resizeGroupImage = async ( req, res, next ) => {
    if ( !req.file ) {
        req.flash( 'error', 'Sorry, there was an error getting the group image. Please try again.' );
        res.render( 'group-form', {
            title: 'Create New Group',
            body: req.body,
            flashes: req.flash()
        });
    }

    const photo = await jimp.read( req.file.buffer );
    await photo.resize( jimp.AUTO, 800 );
    await photo.quality( 80 );

    photo.getBuffer( req.file.mimetype, function( error, result ){

        if ( error ) {
            req.flash( 'error', error );
            res.redirect( 'back' );
        }

        req.body.groupImageResized = result;
        next();
    });
}
// Upload image to Cloudinary
exports.uploadGroupImage = async ( req, res, next ) => {

    const cloudinaryOptions = { 
        resource_type: 'image', 
        folder: 'social-app/groups',
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
            req.body.group_image = result;
            next();
        }
    ).end( req.body.groupImageResized );
    
}
// Save New Group
exports.createNewGroup = async ( req, res, next ) => {

    let group_privacy;

    if ( req.body.private ) {
        group_privacy =  true;
    } else {
        group_privacy = false;
    }

    const group  = {
        name: req.body.name,
        group_image: req.body.group_image.secure_url,
        group_image_id: req.body.group_image.public_id,
        author: ObjectId(req.user._id),
        description: req.body.description,
        members: [ObjectId(req.user._id)],
        private: group_privacy
    };

    const newGroup = new Group( group );

    await newGroup.save(function( error, result ) {
        if ( error ) {
            console.log( error );
            req.flash( 'error', 'There was an issue saving your group. Please try again...' );
            res.redirect( '/' );
            return;
        } else {
            console.log( result );
            req.flash( 'success', `Your group, ${newGroup.name}, has been sucessfully created.` );
            res.redirect( `/community/groups/${newGroup.slug}` );
        }
    });
}


// ----
// Get Group By Slug
exports.getGroupBySlug = async ( req, res ) => {
    const group = await Group.findOne({ slug: req.params.slug });

    if ( !group ) {
        req.flash( 'error', 'There was an error trying to load that group.' );
        res.redirect( '/' );
        return;
    }

    res.render( 'group', {
        title: group.name,
        group: group
    });
}