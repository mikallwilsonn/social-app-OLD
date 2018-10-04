//
const axios = require( 'axios' );

// ---- 
// Like Post
const likeForms = document.querySelectorAll( 'form.like' );

[].forEach.call( likeForms, function( form ) {
    form.addEventListener( 'submit', likePost );
});

function likePost( e ) {
    e.preventDefault();

    axios.post( this.action )
            .then( res => {

                this.likeButton.classList.toggle('btn-white');
                this.likeButton.classList.toggle('btn-success');
                this.likeButton.innerHTML = `
                    <i class="fe fe-thumbs-up"></i> ${res.data.likes.length}
                `;

                let checkAction = this.getAttribute( 'action' ).toString();
                
                if ( checkAction === `/like_post=${res.data._id}` ) {
                    this.setAttribute( 'action', `/unlike_post=${res.data._id}` );
                } else {
                    this.setAttribute( 'action', `/like_post=${res.data._id}` );
                }


            })
            .catch( console.error );
}


// ----
// Mark Notifications As Seen
const notification_button = document.querySelector( '#notification_button' );

notification_button.addEventListener( 'click', function() {
    if ( notification_button.classList.contains( 'has_notifications' ) ) {
        axios.post( '/mark_notifications_as_seen' )
            .then( res => {
                notification_button.classList.remove( 'has_notifications' );
            }).catch( console.error );
    }
});