// ----
// Use this to test exactly what information you are passing through POST requests
exports.postDump = async ( req, res ) => {

    let files;
    let file;

    if ( req.file ) {
        file = req.file;
    } else {
        file = false;
    }

    if ( req.files ) {
        files = req.files;
    } else {
        files = false;
    } 

    res.render( 'dev/postDump', { 
        file,
        files,
        body: req.body
    });

}
