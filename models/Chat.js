const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const mongodbErrorHandler = require( 'mongoose-mongodb-errors' );

const chatSchema = new Schema({
    participants: [{
        _user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        read: {
            type: Boolean
        },
        last_seen: {
            Type: Date
        }
    }],
    messages: [{
        message: {
            type: String
        },
        _author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        date_posted: {
            type: Date
        }
    }],
    open: {
        type: Boolean,
        default: true
    },
    date_created: {
        type: Date,
        default: Date.now
    }
});

function chatPrepopulate( next ) {
    this.populate( 'participants._user' );
    this.populate( 'messages._author' );
    next();
}

chatSchema.pre( 'find', chatPrepopulate );
chatSchema.pre( 'findOne', chatPrepopulate );

chatSchema.plugin( mongodbErrorHandler );

exports.module = mongoose.model( 'Chat', chatSchema );
