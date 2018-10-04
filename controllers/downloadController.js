// Controller Dependencies
const fs = require( 'fs' );
const path = require( 'path' );
const multer = require( 'multer' );

// Settings for Multer
const storage = multer.diskStorage({
    destination: function ( req, file, cb ) {
        cb( null, 'public/resources' )
      },
    filename: function ( req, file, cb ) {
      cb( null, file.originalname.replace( ' ', '-' ))
    }
});


// ----
// Get All Files
// -> Using Node's fs module to query all files within the /public/resources
// -> folder, builds up an array of objects for each file and sends that array
// -> to the downloads view
exports.getResources = ( req, res ) => {

    const files = 'public/resources' ;
    const downloads = [];
    
    fs.readdirSync( files ).forEach( file => {
    
        if ( file != '.DS_Store' ) {
    
            let fileName = file;
            let filePath = `${files}/${file}`;
            let fileSize = fs.statSync( filePath ).size / 1000000; //bytes into megabytes

            if ( fileSize < 1 ) {
                fileSize === '< 1'
            }

            let fileType = path.extname( fileName );

            let resource = {
                name: fileName,
                path: filePath,
                size: fileSize + 'mb',
                downloadURL: `/resources/${fileName}`,
                type: fileType
            }

            downloads.push( resource );
        }
    });

    res.render( 'downloads', {
        title: 'Downloads',
        downloads: downloads
    });
}


// ----
// Delete File 
// -> Locates the specific file by the filename URL parameter
// -> and if it exists to then delete it from the /public/resources folder
exports.deleteFile = async ( req, res ) => {

    const file = `public/resources/${req.params.filename}`;

    if ( fs.existsSync( file ) ) {

        fs.unlink( file, function( error ) {
            if ( error ) {
                req.flash( 'error', `Uh oh. An error occured when trying to delete ${req.params.filename}` )
            }

            req.flash( 'success', `You successfully deleted ${req.params.filename}` );
            res.redirect( '/downloads' );

        });

    } else {

        req.flash( 'error', `Uh oh. Something happened when trying locate ${req.params.filename} in the public/resources directory...` );
        res.redirect( 'back' );

    }
}


// ----
// Upload New File
// -> Using the Multer settings above to take the file uploaded by the 
// -> form in the view and add it to the /public/resources folder
exports.uploadNewFile = multer({ storage: storage }).single( 'file' );
// -> Confirm that a file was uploaded and exists then redirects back
// -> to /downloads
exports.checkForFileThenRedirect = async ( req, res ) => {
    if ( !req.file ) {
        req.flash( 'error', 'Uh oh. There was an error trying to upload your file. Please try again.' );
        res.redirect( '/downloads' );
    }

    req.flash( 'success', 'You successfully uploaded a new file.' );
    res.redirect( '/downloads' );
}
