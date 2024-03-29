const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require( 'md5' );
const validator = require( 'validator' );
const mongodbErrorHandler = require( 'mongoose-mongodb-errors' );
const passportLocalMongoose = require( 'passport-local-mongoose' );


const userSchema = new Schema({
    role: String,
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Invalid Email Address'],
        require: 'Please provide a valid email address.'
    },
    username: {
        type: String,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        require: 'Please provide a name for the account.',
        trim: true
    },
    location: {
        type: String
    },
    avatar: {
        type: String,
        trim: true
    },
    avatar_id: {
        type: String,
        trim: true
    },
    profile_cover: {
        type: String,
        trim: true
    },
    profile_cover_id: {
        type: String,
        trim: true
    },
    profile: {
        bio: {
            type: String,
            trim: true
        },
        birthday: {
            type: Date,
            default: Date.now
        },
        location: {
            type: String,
            trim: true
        },
        gender: {
            type: String,
            trim: true 
        },
        occupation: {
            type: String,
            trim: true 
        },
        relationship_status: {
            type: String,
            trim: true 
        },
        sexual_orientation: {
            type: String,
            trim: true 
        },
        religion: {
            type: String,
            trim: true 
        },
        politics: {
            type: String,
            trim: true 
        }
    },
    contact: {
        website: {
            type: String,
            trim: true
        },
        email: {
            type: Boolean,
        },
        phone: {
            type: String,
            trim: true
        }
    },
    joined_at: {
        type: Date,
        default: Date.now
    },
    public: {
        type: Boolean,
        default: true
    },
    posts: { 
        type: Schema.Types.ObjectId, 
        ref: 'Post'
    },
    groups: { 
        type: Schema.Types.ObjectId, 
        ref: 'Group'
    },
    resetPasswordToken: {
        type: String,
        default: ''
    },
    resetPasswordExpires: {
        type: Date,
        default: Date.now
    },
    seen_notifications: { 
        type: Boolean,
        default: true
    },
    following: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    followers: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    suspended: {
        type: Boolean,
        default: false
    },
    changeEmailToken: {
        type: String,
        default: ''
    },
    changeEmailExpires: {
        type: Date,
        default: Date.now
    },
    new_email: {
        type: String,
        lowercase: true,
        trim: true
    },
    online: {
        type: Boolean,
        default: false
    }
});

userSchema.index({
    'name': 'text',
    'username': 'text'
});


userSchema.plugin( passportLocalMongoose, { usernameField: 'email' } );

module.exports = mongoose.model( 'User', userSchema );