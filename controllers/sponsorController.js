// Controller Dependencies 
const mongoose = require( 'mongoose' );
const cloudinary = require( 'cloudinary' );
const multer = require( 'multer' );
const jimp = require( 'jimp' );

// Models
const Sponsor = mongoose.model( 'Sponsor' );
const SponsorDeal = mongoose.model( 'SponsorDeal' );

// Multer options for uploading a single image
const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter: ( req, file, next ) => {
        const isPhoto = file.mimetype.startsWith('image/');
        if( isPhoto ) {
            next( null, true);
        } else {
            next( {message: 'That filetype isn\'t allowed!'}, false );
        }
    }
};


// ----
// Get Form to create new sponsor page
exports.getNewSponsorForm = ( req, res ) => {
    res.render( 'sponsorForm', { title: 'Create a new sponsor page' });
}
// Get Image files from form
exports.getSponsorImages = multer( multerOptions ).fields([
    { name: 'brand_logo', maxCount: 1 }, 
    { name: 'page_cover', maxCount: 1 }
]);

// Resize Brand Logo with Jimp
exports.resizeBrandLogo = async ( req, res, next ) => {
    if ( !req.files ) {
        next();
        return;
    }

    const brandLogoBuffer = req.files.brand_logo[0].buffer;

    const photo = await jimp.read( brandLogoBuffer );
    await photo.resize( jimp.AUTO, 800 );
    await photo.quality( 80 );
    const photoMIME = photo.getMIME();

    photo.getBuffer( photoMIME, function( error, result ){
        req.body.brandLogoResized = result;
        next();
    });
}
// Upload Brand Logo
exports.uploadBrandLogo = async ( req, res, next ) => {

    if ( !req.files ) {
        next();
    } else {
        cloudinaryOptions = { 
            resource_type: 'image', 
            folder: 'sponsors',
            use_filename: true,
            unique_filename: true 
        }

        await cloudinary.v2.uploader.upload_stream( cloudinaryOptions,
            function( error, result ) {

                if ( error ) {
                    req.flash( 'error', error );
                    res.redirect( 'back');
                    return;
                } 
                req.body.brand_logo = result;
                next();
            }
        ).end( req.body.brandLogoResized );
    }
}
// Resize Page Cover with Jimp
exports.resizePageCover = async ( req, res, next ) => {
    if ( !req.files ) {
        next();
        return;
    }

    const pageCoverBuffer = req.files.page_cover[0].buffer;
    const photo = await jimp.read( pageCoverBuffer );
    await photo.cover( 1600, 900 );
    await photo.quality( 80 );
    const photoMIME = photo.getMIME();

    photo.getBuffer( photoMIME, function( error, result ){
        req.body.pageCoverResized = result;
        next();
    });
}
// Upload Cover for Sponsor Pages
exports.uploadPageCover = async ( req, res, next ) => {

    if ( !req.files ) {
        next();
    } else {
        cloudinaryOptions = { 
            resource_type: 'image', 
            folder: 'sponsors',
            use_filename: true,
            unique_filename: true 
        }

        await cloudinary.v2.uploader.upload_stream( cloudinaryOptions,
            function( error, result ) {

                if ( error ) {
                    req.flash( 'error', error );
                    res.redirect( 'back');
                    return;
                } 
                req.body.page_cover = result;
                next();
            }
        ).end( req.body.pageCoverResized );
    }
}
// Create and Save New Sponsor Page
// -> Takes the URLs and IDs from the previous image uploads as well 
// -> as the text content to create the Sponsor Page
exports.createNewSponsorPage = async ( req, res ) => {

    const sponsor = {
        brand_name: req.body.brand_name,
        brand_profile: req.body.brand_profile,
        brand_logo: req.body.brand_logo.secure_url,
        brand_logo_id: req.body.brand_logo.public_id,
        page_cover: req.body.page_cover.secure_url,
        page_cover_id: req.body.page_cover.public_id,
        deals: []
    }

    const newSponsor = new Sponsor( sponsor );
    await newSponsor.save();
    req.flash( 'success', `A new sponsor page was created for ${req.body.brand_name}` );
    res.redirect( '/sponsors' );
}


// ----
// Get All Sponsors
// -> Queries the database for all Sponsor documents
exports.getSponsors = async ( req, res ) => {
    const sponsors = await Sponsor.find();
    res.render( 'sponsors', { 
        title: 'Our Sponsors',
        sponsors
    }); 
}


// ----
// Get Specific Sponsor by Slug
// -> Queries database for a Sponsor document that matches the :slug
// -> URL parameter to it's slug property
exports.getSponserBySlug = async ( req, res ) => {

    const sponsor = await Sponsor.findOne({ slug: req.params.slug });
    res.render( 'sponsor', { 
        title: sponsor.brand_name,
        pretitle: 'Sponsor',
        cover: sponsor.page_cover,
        logo: sponsor.brand_logo,
        about: sponsor.brand_profile,
        slug: sponsor.slug,
        deals: sponsor.deals
    });
}


// ----
// Get form to create a new sponsor deal
// -> Queries database for a Sponsor document that matches the :slug
// -> URL paramter with it's slug property to associated the form action
// -> with correct Sponsor
exports.newDealForm = async ( req, res ) => {
    const sponsor = await Sponsor.findOne({ slug: req.params.slug });

    if ( !sponsor ) {
        req.flash( 'error', 'Uh oh. There was an error. Please try again, if the problem continues please contact us to look into the problem further.' );
        res.redirect( 'back' );
    }

    res.render( 'sponsor-deal-form', {
        title: sponsor.brand_name,
        pretitle: 'Sponsor',
        cover: sponsor.page_cover,
        logo: sponsor.brand_logo,
        slug: sponsor.slug 
    });
}
// Get Image files from form
exports.getNewDealImage = multer( multerOptions ).single( 'image' );
// Resize Brand Logo with Jimp
exports.resizNewDealImage = async ( req, res, next ) => {
    if ( !req.file ) {
        next();
        return;
    }

    const photo = await jimp.read( req.file.buffer );
    await photo.cover( 500, 500 );
    await photo.quality( 80 );
    const photoMIME = photo.getMIME();

    photo.getBuffer( photoMIME, function( error, result ){
        req.body.newDealImageResized = result;
        next();
    });
}
// Upload Deal Image
exports.uploadNewDealImage = async ( req, res, next ) => {

    if ( !req.file ) {
        next();
    } else {
        cloudinaryOptions = { 
            resource_type: 'image', 
            folder: 'sponsors',
            use_filename: true,
            unique_filename: true 
        }

        await cloudinary.v2.uploader.upload_stream( cloudinaryOptions,
            function( error, result ) {

                if ( error ) {
                    req.flash( 'error', error );
                    res.redirect( 'back');
                    return;
                } 
                req.body.deal_image = result;
                next();
            }
        ).end( req.body.newDealImageResized );
    }
}
// Create and Save the new Deal
exports.createNewDeal = async ( req, res ) => {
    const sponsor = await Sponsor.findOne({ slug: req.params.slug });

    if ( !sponsor ) {
        req.flash( 'error', 'Uh oh, and error occured when trying to save.' );
        res.redirect( 'back' );
    }

    const theDeal = {
        title: req.body.title,
        description: req.body.description,
        code: req.body.deal_code,
        url: req.body.deal_url,
        image: req.body.deal_image.secure_url ,
        image_id: req.body.deal_image.public_id
    }

    const newSponsorDeal = new SponsorDeal( theDeal );
    const updateSponsor = await Sponsor.findByIdAndUpdate( 
        sponsor._id, 
        { $push: { "deals": newSponsorDeal }},
        { safe: true, new : true }
    );

    req.flash( 'success', 'You sucessfully added a members deal for this sponsor.' );
    res.redirect( `/sponsors/${req.params.slug}` );
}