const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const mongodbErrorHandler = require( 'mongoose-mongodb-errors' );


const replySchema = new Schema({
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


replySchema.plugin( mongodbErrorHandler );
module.exports = mongoose.model( 'Reply', replySchema );