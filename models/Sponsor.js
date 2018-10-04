const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const slug = require( 'slugs' );
const mongodbErrorHandler = require( 'mongoose-mongodb-errors' );

const sponsorDealSchema = new Schema({
    title: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    code: {
        type: String,
        trim: true
    },
    url: {
        type: String,
        trim: true
    },
    image: { 
        type: String
    },
    image_id: {
        type: String
    }
});

const sponsorSchema = new Schema({
    brand_name: {
        type: String,
        trim: true
    },
    slug: String,
    brand_profile: {
        type: String,
        trim: true
    },
    brand_logo: {
        type: String,
    },
    brand_logo_id: {
        type: String
    },
    page_cover: {
        type: String
    },
    page_cover_id: {
        type: String
    },
    deals: [sponsorDealSchema]
});

sponsorSchema.pre( 'save', async function( next ) {
    if ( !this.isModified( 'brand_name' )) {
        next();
        return;
    }

    this.slug = slug( this.brand_name );
    const slugRegEx = new RegExp( `^(${this.slug})((-[0-9]*$)?)$`, 'i' );
    const sponsorsWithSlug = await this.constructor.find({ slug: slugRegEx });
    if ( sponsorsWithSlug.length ) {
        this.slug = `${this.slug}-${sponsorsWithSlug.length + 1}`;
    }
    next();
});

sponsorSchema.plugin( mongodbErrorHandler );

module.exports = mongoose.model( 'SponsorDeal', sponsorDealSchema );
module.exports = mongoose.model( 'Sponsor', sponsorSchema );