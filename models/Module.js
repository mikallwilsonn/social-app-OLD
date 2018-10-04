const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const slug = require( 'slugs' );
const mongodbErrorHandler = require( 'mongoose-mongodb-errors' );


const moduleCommentReplySchema = new Schema({
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'Comments are required to be associated with a user.'
    },
    content: {
        type: String,
        trim: true,
        required: 'Replies must have content'
    },
    date_posted: {
        type: Date,
        default: Date.now
    }
});

const moduleCommentSchema = new Schema({
    module: {
        type: mongoose.Schema.ObjectId,
        ref: 'Module',
        required: 'Comments must be associated with '
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'Comments are required to be associated with a user.'
    },
    content: {
        type: String,
        trim: true
    },
    date_posted: {
        type: Date,
        default: Date.now
    },
    replies: [moduleCommentReplySchema]
});

const moduleSchema = new Schema({
    title: {
        type: String,
        trim: true,
        required: 'You must have a name for this module.'
    },
    step: Number,
    slug: String,
    created_at: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        trim: true
    },
    course: {
        type: mongoose.Schema.ObjectId,
        ref: 'Course',
        required: 'Must be associated with a course.'
    },
    video_url: {
        type: String,
    },
    video_id: {
        type: String,
    },
    resource: {
        type: String,
        trim: true
    },
    comments: [moduleCommentSchema]
});


moduleSchema.pre( 'save', async function( next ) {
    if ( !this.isModified( 'title' )) {
        next();
        return;
    }

    this.slug = slug( this.title );
    const slugRegEx = new RegExp( `^(${this.slug})((-[0-9]*$)?)$`, 'i' );
    const modulesWithSlug = await this.constructor.find({ slug: slugRegEx });
    if ( modulesWithSlug.length ) {
        this.slug = `${this.slug}-${modulesWithSlug.length + 1}`;
    }
    next();
});

function findOneAutopopulate( next ) {
    this.populate( 'course' )
    this.populate( 'comments.author' )
    this.populate( 'comments.replies' )
    this.populate( 'comments.replies.author' )
    next();
}

moduleSchema.pre( 'findOne', findOneAutopopulate );

moduleCommentReplySchema.plugin( mongodbErrorHandler );
moduleCommentSchema.plugin( mongodbErrorHandler );
moduleSchema.plugin( mongodbErrorHandler );

module.exports = mongoose.model( 'Module', moduleSchema );