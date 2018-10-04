const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const mongodbErrorHandler = require( 'mongoose-mongodb-errors' );


const updateCommentReplySchema = new Schema({
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

const updateCommentSchema = new Schema({
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
    replies: [ updateCommentReplySchema ]
});

const updateSchema = new Schema({
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'Posts must have an author.'
    },    
    date_posted: {
        type: Date,
        default: Date.now
    },
    text: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        trim: true
    },
    image_id: {
        type: String,
        trim: true
    },
    longitude: {
        type: String,
        trim: true
    },
    latitude: {
        type: String,
        trim: true
    },
    duration: {
        type: String,
        trim: true
    },
    distance: {
        type: String,
        trim: true
    },
    state_of_mind: {
        type: String,
        trim: true
    },
    comments: [ updateCommentSchema ]
});

function findAutopopulate( next ) {
    this.populate( 'author' );
    this.populate( 'comments.author' );
    this.populate( 'comments.replies' );
    this.populate( 'comments.replies.author' );
    next();
}

updateSchema.pre( 'find', findAutopopulate );

updateSchema.plugin( mongodbErrorHandler );
module.exports = mongoose.model( 'DeadseaUpdate', updateSchema );