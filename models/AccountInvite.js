const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const mongodbErrorHandler = require( 'mongoose-mongodb-errors' );

const accountInviteSchema = new Schema({
    key: {
        type: String
    },
    email: {
        type: String,
        trim: true, 
        unique: true
    },
    request: {
        type: Boolean
    },
    date_created: {
        type: Date,
        default: Date.now
    }
});

accountInviteSchema.plugin( mongodbErrorHandler );
module.exports = mongoose.model( 'AccountInvite', accountInviteSchema );