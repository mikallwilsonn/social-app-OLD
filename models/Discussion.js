const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const mongodbErrorHandler = require( 'mongoose-mongodb-errors' );
const slug = require( 'slugs' );


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

const discussionSchema = new Schema({
    slug: {
        type: String
    },
    _group: {
        type: mongoose.Schema.ObjectId,
        Ref: 'Group'
    },
    _author: {
        type: mongoose.Schema.ObjectId,
        Ref: 'User'
    },
    date_created: {
        type: Date,
        default: Date.now
    },
    topic: {
        type: String,
        trim: true
    },
    content: {
        type: String
    },
    responses: [ responseSchema ]
});


discussionSchema.pre( 'save', async function( next ) {
    if (!this.isModified( 'topic' )) {
        next(); // Skip it
        return; // Stop this function from running
    }
    this.slug = slug( this.topic );
    // find other stores of same name
    const slugRegEx = new RegExp( `^(${this.slug})((-[0-9]*$)?)$`, 'i' );
    const discussionsWithSlug = await this.constructor.find({ slug: slugRegEx });
    if( discussionsWithSlug.length ) {
        this.slug = `${this.slug}-${discussionsWithSlug.length + 1}`;
    }
    next();
});

function preFindAutopopulate( next ) {
    this.populate( '_author' );
    this.populate( 'responses._author' );
    next();
}

discussionSchema.pre( 'find', preFindAutopopulate );
discussionSchema.pre( 'findOne', preFindAutopopulate );



module.exports = mongoose.model( 'Discussion', discussionSchema );