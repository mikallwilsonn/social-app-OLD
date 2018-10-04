const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const mongodbErrorHandler = require( 'mongoose-mongodb-errors' );


const commentSchema = new Schema({
    post: {
        type: mongoose.Schema.ObjectId,
        ref: 'Post'
    },
    module: {
        type: mongoose.Schema.ObjectId,
        ref: 'Module'
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
    }
});


commentSchema.plugin( mongodbErrorHandler );

module.exports = mongoose.model( 'Comment', commentSchema );