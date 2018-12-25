const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const mongodbErrorHandler = require( 'mongoose-mongodb-errors' );

const responseSchema = new Schema({
    _author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'Discussion responses must be associated with a user.'
    },
    date_created: {
        type: Date,
        default: Date.now
    },
    content: {
        type: String
    }
});



responseSchema.plugin( mongodbErrorHandler );

module.exports = mongoose.model( 'Response', responseSchema );