const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const mongodbErrorHandler = require( 'mongoose-mongodb-errors' );

const notificationSchema = new Schema({
    action: {
        type: String,
        required: 'Actions need to be associatd with a notification.'
    },
    actor: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'Notifications need to be associated with an actor.'
    },
    medium: {
        type: String,
        required: 'Notificatios must be associated with an action ON a certain piece of content.'
    },
    medium_ref: {
        type: String,
        required: 'Notifications must have the associated id to the medium being acted on.'
    },
    medium_owner: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'Notifications must be associated with the owner of the piece of content being acted on.'
    },
    date_posted: {
        type: Date,
        default: Date.now,
        required: 'Notifications must have a date at which they were created at.'
    },
    notify: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'Must set who will be notified'
    }
});

notificationSchema.plugin( mongodbErrorHandler );
module.exports = mongoose.model( 'Notification', notificationSchema );