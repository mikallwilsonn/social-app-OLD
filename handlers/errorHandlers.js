// ----
// Catch Errors
exports.catchErrors = ( fn ) => {
    return function( req, res, next ) {
        return fn( req, res, next ).catch( next );
    }
}


// ----
// Check if 404
exports.notFound = ( req, res, next ) => {
    const err = new Error( 'Not Found' );
    err.status = 404;
    if ( err.status === 404 ) {
        res.render( 'error' )
    } else {
        next( err );
    }
};


// ----
// Flash Validation Errors
exports.flashValidationErrors = ( err, req, res, next ) => {
    if ( !err.errors ) return next( err );
    const errorKeys = Object.keys( err.errors );
    errorKeys.forEach( key => req.flash( 'failure', err.errors[key].message ));
    res.redirect( 'back' );
}


// ----
// Development Errors
exports.developmentErrors = ( err, req, res, next ) => {
    err.stack = err.stack || '';
    const errorDetails = {
        message: err.message,
        status: err.status,
        stackHighlighted: err.stack.replace(/[a-z_-\d]+.js:\d+:\d+/gi, '<mark>$&</mark>')
    };
    res.status( err.status || 500 );
    res.format({
        'text/html': () => {
            res.render( 'error', errorDetails );
        },
        'application/json': () => res.json( errorDetails )
    });
};


// ----
// Production Errors
exports.productionErrors = ( err, req, res, next ) => {
    res.status( err.status || 500 );
    res.render( 'error', {
        message: err.message,
        error: {}
    });
};