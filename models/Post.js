const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const mongodbErrorHandler = require( 'mongoose-mongodb-errors' );


const postCommentReplySchema = new Schema({
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'Comments are required to be associated with a user.'
    },
    content: {
        type: String,
        trim: true,
        required: 'A reply needs content'
    },
    date_posted: {
        type: Date,
        default: Date.now
    }
});

const postCommentSchema = new Schema({
    post: {
        type: mongoose.Schema.ObjectId,
        ref: 'Post',
        required: 'Comments must be associated with '
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'Comments are required to be associated with a user.'
    },
    content: {
        type: String,
        trim: true,
        required: 'A comment needs content'
    },
    date_posted: {
        type: Date,
        default: Date.now
    },
    replies: [ postCommentReplySchema ]
});


const postSchema = new Schema({
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'Posts must have an author.'
    },
    date_posted: {
        type: Date,
        default: Date.now
    },
    post_content: {
        type: String,
        trim: true
    },
    post_image: {
        type: String,
        trim: true
    },
    post_image_id: {
        type: String,
        trim: true
    },
    comments: [ postCommentSchema ],
    likes: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'Likes must be associated with a user',
        unique: true
    }],
    reports: {
        is_reported: {
            type: Boolean,
            default: false
        },
        reported_by: [{
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            unique: true
        }]
    }
    
});

function findAutopopulate( next ) {
    this.populate( 'author' );
    next();
}

function findOneAutopopulate( next ) {
    this.populate( 'author' );
    this.populate( 'comments.author' );
    this.populate( 'comments.replies' );
    this.populate( 'comments.replies.author' );
    next();
}

postSchema.pre( 'find', findAutopopulate );
postSchema.pre( 'findOne', findOneAutopopulate );

postCommentReplySchema.plugin( mongodbErrorHandler );
postCommentSchema.plugin( mongodbErrorHandler );
postSchema.plugin( mongodbErrorHandler );

module.exports = mongoose.model( 'Post', postSchema );
