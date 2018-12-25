const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const mongodbErrorHandler = require( 'mongoose-mongodb-errors' );
const slug = require( 'slugs' );

const groupSchema = new Schema({
    name: {
        type: String,
        trim: true
    },
    slug: {
        type: String
    },
    group_image: {
        type: String
    },
    group_image_id: {
        type: String
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        Ref: 'User',
        required: 'Groups need to have an author'
    },
    description: {
        type: String,
        trim: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        Ref: 'User'   
    }],
    private: {
        type: Boolean,
        default: false
    },
    date_created: {
        type: Date,
        default: Date.now
    }
});

groupSchema.pre( 'save', async function( next ) {
    if (!this.isModified( 'name' )) {
        next(); // Skip it
        return; // Stop this function from running
    }
    this.slug = slug( this.name );
    // find other stores of same name
    const slugRegEx = new RegExp( `^(${this.slug})((-[0-9]*$)?)$`, 'i' );
    const groupsWithSlug = await this.constructor.find({ slug: slugRegEx });
    if( groupsWithSlug.length ) {
        this.slug = `${this.slug}-${groupsWithSlug.length + 1}`;
    }
    next();
});

function findAutopopulate( next ) {
    this.populate( 'author' );
    next();
}

function findOneAutopopulate( next ) {
    this.populate( 'author' );
    this.populate( 'members' );
    next();
}

groupSchema.pre( 'find', findAutopopulate );
groupSchema.pre( 'findOne', findOneAutopopulate );


groupSchema.plugin( mongodbErrorHandler );
module.exports = mongoose.model( 'Group', groupSchema );