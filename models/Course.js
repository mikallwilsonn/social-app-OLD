const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const slug = require( 'slugs' );
const mongodbErrorHandler = require( 'mongoose-mongodb-errors' );

const courseSchema = new Schema({
    title: {
        type: String,
        trim: true,
        require: 'Please enter a course name.'
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: 'There must be a user associated with this course.'
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    modules: {
        type: Schema.Types.ObjectId,
        ref: 'Module'
    },
    image: {
        type: String,
        trim: true
    },
    image_id: {
        type: String,
        trim: true
    }

});

courseSchema.pre('save', async function( next ) {
    if ( !this.isModified( 'title' )) {
        next();
        return; 
    }
    this.slug = slug( this.title );
    // find other stores of same name
    const slugRegEx = new RegExp( `^(${this.slug})((-[0-9]*$)?)$`, 'i' );
    const coursesWithSlug = await this.constructor.find( {slug: slugRegEx} );
    if( coursesWithSlug.length ) {
        this.slug = `${this.slug}-${coursesWithSlug.length + 1}`;
    }
    next();
});

function findAutopopulate( next ) {
    this.populate( 'author' );
    next();
}

courseSchema.pre( 'find', findAutopopulate );

courseSchema.plugin( mongodbErrorHandler );

module.exports = mongoose.model( 'Course', courseSchema );