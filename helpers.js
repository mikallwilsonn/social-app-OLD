// ----
// Global Variables
exports.siteInfo = {
    name: 'SocialApp',
    description: 'A basic social media app.',
    keywords: 'social, media, app',
    author: 'Michael R. Wilson',
    copyrightOwner: 'Michael R. Wilson'
};

// ----
// Handelbarshjs Helpers
const hbs = require( 'hbs' );

// Dump for quick debugging
hbs.registerHelper( 'dump', function( obj ) {
    let theObj = JSON.stringify( obj, null, 2 );
    let theDump = `<pre><code> ${theObj}</code></pre>`;
    return new hbs.SafeString( theDump );
});

// ----
// Format Date / Time
const moment = require( 'moment' );
hbs.registerHelper( 'moment', function( date ) {
    let theDate = moment( date ).format( 'dddd, MMMM Do YYYY' );
    return new hbs.SafeString( theDate );
});

hbs.registerHelper( 'moment_ago', function( date ) {
    let theDate = moment( date ).fromNow();
    return new hbs.SafeString( theDate );
});

hbs.registerHelper( 'birthday_format', function( date) {
    let birthday = moment( date ).format( 'Y-M-D' );
    // year-month-day
    return new hbs.SafeString( birthday );
});


// ----
// Formats plain text to include line breaks when
// rendered on page.
hbs.registerHelper( 'breaklines', function( text ) {
    text = hbs.Utils.escapeExpression( text );
    text = text.replace( /(\r\n|\n|\r)/gm, '<br>' );
    return new hbs.SafeString(text);
});


// ----
// Creates an excerpt of a string 
hbs.registerHelper( 'trimString', function( passedString, start, end) {
    let passedStringLength = passedString.length;
    passedString = passedString.toString();
    let theString = passedString.substring( start, end );
    if ( passedStringLength >= end ) {
        theString = theString + '...';
    }
    return new hbs.SafeString( theString );
});


// ----
// Country Check
hbs.registerHelper( 'country_check', function( saved ) {
    let theString = '';

    if ( saved === '' ) {

        theString = '<option selected="selected" disabled="disabled" value="">Choose Your Country</option>';

    } else {

        theString = `<option id="country_default" selected="${saved}" value="${saved}">${saved}</option>
        <option id="country_default-divider" disabled="disabled">-------------------</option>
        `
    }

    return new hbs.SafeString( theString );
});


// ----
// Comments Count
hbs.registerHelper( 'comments_count', function( comments ) {

    let count = 0;

    comments.forEach.call(comments, function( comment ) {
        count = count + comment.replies.length;
    });

    count = count + comments.length;
    return new hbs.SafeString( count );

});


// ----
// Count Likes
hbs.registerHelper( 'post_likes', function( likes, user, post_id ) {

    let count = likes.length;
    let html = '';

    if ( likes.indexOf(user) === -1 ) {
        html = `
        <form class="like" style="display: inline;" method="POST" action="/like_post=${post_id}">
            <button name="likeButton" class="btn btn-sm btn-white" data-toggle="tooltip" data-placement="top" title="Like this post!">
            <i class="fe fe-thumbs-up"></i> ${count}
            </button>
        </form>
        `;
    } else {
        html = `
        <form class="like" style="display: inline;" method="POST" action="/unlike_post=${post_id}">
            <button name="likeButton" class="btn btn-sm btn-success" data-toggle="tooltip" data-placement="top" title="Unlike this post?">
                <i class="fe fe-thumbs-up"></i> ${count}
            </button>
        </form> 
        `;
    }

    return new hbs.SafeString( html );

});


// ----
// Follow / Unfollow User
hbs.registerHelper( 'follow_unfollow', function(user, profile_id, followers) {

    let html = '';

    if ( followers.indexOf(user) === -1 ) {
        html = `
            <form method="POST" action="/follow_user=${profile_id}">
                <button type="submit" class="btn btn-primary d-block d-md-inline-block">Follow</button>
            </form>
        `;
    } else {
        html = `
            <form method="POST" action="/unfollow_user=${profile_id}">
                <button type="submit" class="btn btn-secondary d-block d-md-inline-block">Unfollow</button>
            </form>
        `;
    }

    return new hbs.SafeString( html );

});


// ----
// Role Badge
hbs.registerHelper( 'role_badge', function(role) {
    let html = '';

    if ( role === 'admin' ) {
        html = `<span class="badge badge-soft-danger">${role}</span>`;
    } else if ( role === 'member' ) {
        html = `<span class="badge badge-soft-primary">${role}</span>`;
    }

    return new hbs.SafeString( html );
});


// ----
// Delete Post
hbs.registerHelper( 'delete_post', function( author, user, role, post_id ) {
    let html = '';
    author = author.toString();
    user = user.toString();

    if ( author == user || role == 'admin' ) {
        html = `
            <form method="POST" action="/delete_post=${post_id}" class="dropdown-item" data-alert="true" data-alert-text="You are about to DELETE this post..." data-alert-icon="warning">
                <button class="dropdown-item text-danger">
                    <i class="fe fe-trash-2"></i> Delete Post
                </button>
            </form>
        `;
    }

    return new hbs.SafeString( html );
});


// ----
// Report Post
hbs.registerHelper( 'report_post', function( author, user, reports, post_id ) {
    let html = '';
    author = author.toString();
    user = user.toString();

    if ( author != user ) {

        if ( reports.reported_by.indexOf( user ) === -1 ) {
            html = `
                <form method="POST" action="/report_post=${post_id}" class="dropdown-item" data-alert="true" data-alert-text="You are about to REPORT this post for malicious activity..." data-alert-icon="warning">
                    <button class="dropdown-item text-warning">
                        <i class="fe fe-alert-triangle"></i> Report Post
                    </button>
                </form>
            `;
        } else {
            html = `
                <form class="dropdown-item">
                    <p class="dropdown-item text-muted">
                        <i class="fe fe-alert-triangle"></i> Awaiting Review
                    </p>
                </form>
            `;
        }

    }

    return new hbs.SafeString( html );
});


// ----
// Mark Post As Safe
hbs.registerHelper( 'mark_as_safe', function( author, user, role, reports, post_id ) {
    let html = '';
    author = author.toString();
    user = user.toString();

    if ( reports.reported_by.length > 0 && role == 'admin' ) {
        html = `
            <form method="POST" action="/mark_post_as_safe=${post_id}" class="dropdown-item" data-alert="true" data-alert-text="You are about to confirm your review of this post and MARK AS SAFE..." data-alert-icon="warning">
                <button class="dropdown-item text-success">
                    <i class="fe fe-check"></i> Mark As Safe
                </button>
            </form>
        `;
    }

    return new hbs.SafeString( html );
});


// ----
// Admin : Edit User : Role Check
hbs.registerHelper( 'role_check', function( role ) {
    let option = `
        <option id="country_default" selected="${role}" value="${role}">${role}</option>
        <option id="country_default-divider" disabled="disabled">-------------------</option>
    `;

    return new hbs.SafeString( option );
});


// ----
// User : Suspend : OR : Unsuspend
hbs.registerHelper( 'suspend_user', function( suspended, user_id, name ) {
    let html = '';
    suspended = suspended.toString();

    if ( suspended == 'false' || suspended == undefined || suspended == null ) {
        html = `
            <form method="POST" action="/admin/suspend_user=${user_id}" class="dropdown-item" data-toggle="tooltip" data-placement="left" title="Places user account under suspension. They will not be able to login until suspension has been revoked." data-alert="true" data-alert-text="You are about to SUSPEND the user account for ${name}..." data-alert-icon="warning">
                <button class="dropdown-item text-warning">
                    <i class="fe fe-lock"></i> Suspend User
                </button>
            </form>
        `;
    } else {
        html = `
            <form method="POST" action="/admin/unsuspend_user=${user_id}" class="dropdown-item" data-toggle="tooltip" data-placement="left" title="Revokes suspension. User will then be able to log back into account." data-alert="true" data-alert-text="You are about to REVOKE the suspension for ${name}'s account..." data-alert-icon="warning">
                <button class="dropdown-item text-muted">
                    <i class="fe fe-unlock"></i> Revoke Suspension
                </button>
            </form>
        `;
    }

    return new hbs.SafeString( html );
});


// ----
// Set Course Form Action
hbs.registerHelper( 'course_form_action', function( course_id, slug ) {

    let action = '';

    if ( course_id && slug ) {
        action = `action="/courses/${slug}/edit"`;
    } else {
        action = `action="/courses/new"`;
    }

    return new hbs.SafeString( action );
});

// ----
// Set Module Form Action
hbs.registerHelper( 'module_form_action', function( course_slug, module_id, slug ) {

    let action = '';

    if ( module_id && slug ) {
        action = `action="/courses/${course_slug}/${slug}/edit"`;
    } else {
        action = `action="/courses/${course_slug}/new"`;
    }

    return new hbs.SafeString( action );
});


// ----
// Privacy Control
hbs.registerHelper( 'privacy_control', function( public ){
    let html = '';

    if ( public == true ) {
        html = `
            <div class="custom-control custom-checkbox-toggle">
                <input type="checkbox" class="custom-control-input" id="privacy" name="privacy" checked>
                <label class="custom-control-label" for="privacy" id="privacy_label"></label>
            </div>
        `;
    } else {
        html = `
            <div class="custom-control custom-checkbox-toggle">
                <input type="checkbox" class="custom-control-input" id="privacy" name="privacy">
                <label class="custom-control-label" for="privacy" id="privacy_label"></label>
            </div>
        `;
    }

    return new hbs.SafeString( html );
});


// ----
// Privacy Text
hbs.registerHelper( 'privacy_text', function( public ) {

    let text = '';

    if ( public == true ) {
        text = 'Your profile is currently public.';
    } else {
        text = 'Your profile is currently private.'
    }

    return new hbs.SafeString( text );

});


// ----
// Email Privacy Control
hbs.registerHelper( 'email_privacy_control', function( public ) {
    let html = '';

    if ( public == true ) {
        html = `
            <div class="custom-control custom-checkbox-toggle">
                <input type="checkbox" class="custom-control-input" id="email_privacy" name="email_privacy" checked>
                <label class="custom-control-label" for="email_privacy" id="email_privacy_label"></label>
            </div>
        `;
    } else {
        html = `
            <div class="custom-control custom-checkbox-toggle">
                <input type="checkbox" class="custom-control-input" id="email_privacy" name="email_privacy">
                <label class="custom-control-label" for="email_privacy" id="email_privacy_label"></label>
            </div>
        `;
    }

    return new hbs.SafeString( html );
});

// ----
// Email Privacy Text
hbs.registerHelper( 'email_privacy_text', function( public ) {

    let text = '';

    if ( public == true ) {
        text = 'Your email is currently public.';
    } else {
        text = 'Your email is currently private.'
    }

    return new hbs.SafeString( text );

});

// ----
// URL Privacy Filter
hbs.registerHelper( 'url_privacy_filter', function( public, username ) {

    let url = '';

    if ( public == true ) {
        url = `/users/@${username}`;
    } else {
        url = '#';
    }

    return new hbs.SafeString( url );

});


// ----
// Indicate Active Link for current path
hbs.registerHelper( 'is_active_path', function( path ) {
    if ( currentPath = path ) {
        return new hbs.SafeString( 'active' );
    } 
});
