// Controller Dependencies
const mongoose = require( 'mongoose' );
const ObjectId = require( 'mongodb' ).ObjectId;
const promisify = require( 'es6-promisify' );
const cloudinary = require( 'cloudinary' );
const multer = require( 'multer' );
const jimp = require( 'jimp' );
const slug = require( 'slugs' );

// Models
const Course = mongoose.model( 'Course' );
const Module = mongoose.model( 'Module' );
const Comment = mongoose.model( 'Comment' );
const Reply = mongoose.model( 'Reply' );

// Multer options for a single image upload
const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter: ( req, file, next ) => {
        const isPhoto = file.mimetype.startsWith( 'image/' );
        if( isPhoto ) {
            next( null, true );
        } else {
            next({ message: 'That filetype isn\'t allowed!' }, false );
        }
    }
};

// Multer options for a video upload
const multerOptionsVideo = {
    storage: multer.memoryStorage(),
    fileFilter: ( req, file, next ) => {
        const isVideo = file.mimetype.startsWith( 'video/' );
        if( isVideo ) {
            next( null, true );
        } else {
            next({ message: 'That filetype isn\'t allowed!' }, false );
        }
    }
};

// Multer options for multiple image upload
const multerMutliOptions = {
    storage: multer.memoryStorage(),
    fileFilter: ( req, files, next ) => {
        const isVideo = file.mimetype.startsWith( 'video/' );
        const isPhoto = file.mimetype.startsWith( 'image/' );
        if( isVideo || isPhoto ) {
            next( null, true );
        } else {
            next({ message: 'That filetype isn\'t allowed!' }, false );
        }
    }
};


// ----
// Get all Courses
// -> Query the database for all Course documents in
// -> descending order of the date stored in the created_at property
exports.getCourses = async ( req, res ) => {

    const courses = await Course.find().sort({ created_at: 'descending' });

    res.render( 'courses', {
        title: 'Survive Anything with Charlie Engle',
        pretitle: 'Survival Course Overview',
        description: 'Select a course below to get started and get notified by email when new Survive Anything courses become available.',
        courses,
        modalContent: 'Subscribe to be informed when you can join the next live training session(s)!'
    });
}


// ----
// Create a new course
// -> Renders the form for admins to create a new Course
exports.newCourseForm = ( req, res ) => {
    res.render( 'course-form', { 
        title: 'Create a new Course',
        button_text: 'Create Course'
    });
}
// Get image from file input
exports.getCourseImage = multer( multerOptions ).single( 'image' );
// Resize the image handled by multer 
exports.resizeCourseImage = async ( req, res, next ) => {
    if ( !req.file ) {
        next();
        return;
    }

    const photo = await jimp.read( req.file.buffer );
    await photo.cover( 1600, 900 );
    const photoMIME = photo.getMIME();

    photo.getBuffer( photoMIME, function( error, result ){
        req.body.courseImageResized = result;
        next();
    });
}
// Upload to Cloudinary
exports.uploadCourseImage = async ( req, res, next ) => {

    if ( !req.file ) {
        next();
    } else {
        cloudinaryOptions = { 
            resource_type: 'image', 
            folder: 'courses',
            use_filename: true,
            unique_filename: true 
        }

        await cloudinary.v2.uploader.upload_stream( cloudinaryOptions,
            function( error, result ) {

                if ( error ) {
                    req.flash( 'error', error );
                    res.redirect( 'back' );
                    return;
                } 
                req.body.image = result;
                next();
            }
        ).end( req.body.courseImageResized );
    }
}
// Store the course in the database
exports.createNewCourse = async ( req, res ) => {
    const course  = {
        author: req.user._id,
        title: req.body.title,
        description: req.body.description,
        image: req.body.image.secure_url,
        image_id: req.body.image.public_id
    };
    const newCourse = new Course( course );
    await newCourse.save();
    req.flash( 'success', 'Your successfully created a new Course. Next, create some modules' );
    res.redirect( '/courses' );
}


// ----
// Get Course by SLUG
// -> Query the database for a specific Course document
// -> by the slug property using the URL parameter of :slug
// -> IF no Course is found, redirect back. Otherwise query the database
// -> for the modules associated with that course
exports.getCourseBySlug = async ( req, res ) => {
    const course = await Course.findOne( { slug: req.params.slug } );

    if ( !course ) {
        req.flash( 'error', 'Sorry, no course could be found at that URL.' );
        res.redirect( '/courses' );
    }

    const modules = await Module.find( { course: course._id } );

    res.render( 'course', { 
        title: course.title,
        course,
        modules 
    });
}


// ----
// Create New Module
// -> Renders the form to create a new course module
exports.newModuleForm = ( req, res ) => {
    const course_slug = req.params.slug
    res.render( 'module-form', { 
        title: 'Create a Course Module', 
        course_slug,
        button_text: 'Create Module' 
    });
}
// Get Video from file input
exports.getModuleVideo = multer( multerOptionsVideo ).single( 'video' );
// Upload to Cloudinary
exports.uploadModuleVideo = async ( req, res, next ) => {

    if ( !req.file ) {
        next();
    } else {
        cloudinaryOptions = { 
            resource_type: 'video', 
            folder: 'courses',
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
                req.body.video = result;
                next();
            }
        ).end( req.file.buffer );
    }
}
// Store the course in the database
exports.createNewModule = async ( req, res ) => {

    const course = await Course.findOne( {slug: req.params.slug} );

    if ( !course ) { 
        req.flash( 'error', 'There was an error saving module: could not find course to associate with.');
        res.render( 'module-form', req.body  );
    }

    const modulesCount = await Module.find({ course: course._id });
    const step = modulesCount.length + 1;

    const module  = {
        course: course._id,
        step: step,
        title: req.body.title,
        description: req.body.description,
        video_url: req.body.video.secure_url,
        video_id: req.body.video.public_id,
        resource: '',
        comments: []
    };

    const newModule = new Module( module );
    await newModule.save();

    req.flash( 'success', 'Your successfully created a new Course Module.' );
    res.redirect( `/courses/${course.slug}` );
}


// ----
// Get Module By Slug
// -> Query database for a Module document by the slug provided
// -> in the URL parameter :module
exports.getModuleBySlug = async ( req, res ) => {

    const module = await Module
        .findOne({ slug: req.params.module });

    if ( !module ) {
        req.flash( 'error', 'Sorry, no module could be found.' );
        res.redirect( 'back' );
    }

    const mediaelement = true;

    res.render( 'module', {
        module_id: module._id,
        module_slug: module.slug,
        title: module.title,
        step: module.step,
        cover: module.image,
        content: module.description,
        mediaelement,
        video: module.video_url,
        course: module.course,
        comments: module.comments
    });
}


// ----
// Post Comment To Module
// -> Query the database to confirm the module exists with the
// -> URL parameter :module_id, if none is found then redirect back
// -> Other wise creates a comment object and then updates the module
// -> comments array by pushing the new comment to it
exports.postCommentToModule = async ( req, res ) => {

    const module = await Module.findOne({ _id: req.params.module_id });

    if ( !module ) {
        req.flash( 'error', 'Uh oh, an error occured and your comment could not be saved.' );
        res.redirect( 'back' );
    }

    const comment = {
        author: req.user._id,
        module: module._id,
        content: req.body.comment,
        replies: []
    }

    const newComment = new Comment( comment );

    await Module.findByIdAndUpdate( 
        module._id, 
        { $push: { "comments": newComment }}, 
        { safe: true, new : true }
    );
                                            

    req.flash( 'success', `You successfully posted a comment to ${module.title}` );
    res.redirect( 'back' );

}


// ----
// Post Reply to Comment
// -> Queries database with URL parameter to confirm comment exists
// -> then creates a reply object to then push to the replies array
// -> inside the specific comment of the comments array
exports.postReplyToModuleComment = async ( req, res ) => {
    const comment_id = req.params.comment_id;
    const moduleWithComment = await Module.findOne({ 'comments._id': comment_id });

    if ( !moduleWithComment ) {
        req.flash( 'error', `Uh oh, an error occured and your comment reply could not be saved. The comment you tried to search for had an _id of ${req.params.comment_id} ` );
        res.redirect( 'back' );
    }

    const reply = {
        author: req.user._id,
        content: req.body.reply
    }

    const newReply = new Reply( reply );    
    await Module.findByIdAndUpdate( 
        { '_id': moduleWithComment._id,
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


// ----
// Edit Course
// -> Queries the databse for the specific Course document by
// -> the :slug URL parameter and the renders the course form
exports.editCourse = async ( req, res ) => {

    const course = await Course.findOne({ slug: req.params.slug });

    if ( !course ) {
        req.flash( 'error', 'Uh oh. Something happened when trying to load the course information. Please try again...' );
        res.redirect( 'back' );
    }

    res.render( 'course-form', { 
        title: `Edit: ${course.title}`,
        course: course,
        button_text: 'Update Course' 
    });

}


// ----
// Update Course
// -> After the new image has been handled by previous functions to
// -> upload and optimized, the image will then be uploaded and upon
// -> success taking the public_id of the previous image to delete the
// -> image from Cloudinary
exports.uploadNewDeleteOldCourseImage = async ( req, res, next ) => {
    cloudinaryOptions = { 
        resource_type: 'image', 
        folder: 'courses',
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

            cloudinary.v2.api.delete_resources(req.body.previousID,
                function(error, result){console.log(result);}
            );

            req.body.image = result;
            next();
        }
    ).end( req.body.courseImageResized );
}
// Save the updated Course data
exports.updateCourse = async ( req, res ) => {

    const course = await Course.findOne({ slug: req.params.slug });

    if ( !course ) {
        req.flash( 'error', 'Uh oh. Something happened when trying to save. Please try again...' );
        res.redirect( 'back' );
    }

    let image = '';
    let image_id = '';

    if ( req.file ) {
        image = req.body.image.secure_url;
        image_id = req.body.image.public_id;
    } else {
        image = course.image;
        image_id = course.image_id;
    }

    const updates  = {
        title: req.body.title,
        description: req.body.description,
        slug: slug( req.body.title ),
        image: image,
        image_id: image_id
    };

    await Course.findOneAndUpdate(
        { _id: course._id },
        { $set: updates },
        {
            new: true,
            runValidators: true,
            context: 'query'
        }
    );

    req.flash( 'success', `You successfully updated the content for ${course.title}!` );
    res.redirect( `/courses/${updates.slug}` );
}


// ----
// Edit Module
// -> Query the database for the Module document with the
// -> :module URL parameter and if it exists rendering the 
// -> form to then edit the Module
exports.editModule = async ( req, res ) => {
    const module = await Module.findOne({ slug: req.params.module });

    if ( !module ) {
        req.flash( 'error', 'Uh oh. Something happened when trying to load the module information. Please try again...' );
        res.redirect( 'back' );
    }

    res.render( 'module-form', { 
        title: `Edit: ${module.title}`,
        module: module,
        button_text: 'Update Course Module',
        course_slug: req.params.course
    });

}


// ----
// Update Module
// -> After the new video has been handled by previous functions to
// -> upload and optimized, the video will then be uploaded and upon
// -> success taking the public_id of the previous video to delete the
// -> image from Cloudinary
exports.deleteOldModuleVideo = async ( req, res, next ) => {

    if ( !req.file ) {
        next();
    }

    const module = await Module.findOne({ slug: req.params.module });

    cloudinaryOptions = { 
        resource_type: 'image', 
        folder: 'courses',
        use_filename: true,
        unique_filename: true 
    }

    await cloudinary.v2.api.delete_resources( module.video_id,
        function( error, result ) {
            console.log(result);
        }
    );

    next();
}
// Update Module
exports.updateModule = async ( req, res ) => {

    const module = await Module.findOne({ slug: req.params.module });

    if ( !module ) {
        req.flash( 'error', 'Uh oh. Something happened when trying to save. Please try again...' );
        res.redirect( 'back' );
    }

    let video = '';
    let video_id = '';

    if ( req.file ) {
        video = req.body.video.secure_url;
        video_id = req.body.video.public_id
    } else {
        video = module.video;
        video_id = module.video_id;
    }

    const updates  = {
        title: req.body.title,
        description: req.body.description,
        slug: slug( req.body.title ),
        video: video,
        video_id: video_id
    };

    await Module.findOneAndUpdate(
        { _id: module._id },
        { $set: updates },
        {
            new: true,
            runValidators: true,
            context: 'query'
        }
    );

    req.flash( 'success', `You successfully updated the content for ${module.title}!` );
    res.redirect( `/courses/${req.params.course}/${updates.slug}` );

}