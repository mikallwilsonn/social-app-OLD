// ----
// Rendering images in the browser before final upload
const upload = document.querySelector( 'input#upload' );
const uploadPreviewContainer = document.querySelector( 'div#uploadPreview__container' );
const uploadPreview = document.querySelector( 'img#uploadPreview' );
const submitUpload = document.querySelector( 'button#submitUpload' );

if ( upload ) {

    function renderImage( file ) {
        let reader = new FileReader();
        reader.onload = function( event ) {
            let the_url = event.target.result;
            uploadPreviewContainer.style.display = 'inline-block';
            uploadPreview.setAttribute( 'src', the_url );
        }

        reader.readAsDataURL( file );
    }

    upload.addEventListener( 'change', function() {
        submitUpload.disabled = false;
        renderImage( this.files[0] );
    });
}

// ----
// /profile/settings country select element
const profileCountrySelect = document.querySelector( 'select[name="location"]' );
const profileCountrySelectDefault = document.querySelector( '#country_default');

if ( profileCountrySelect ) {
    profileCountrySelect.addEventListener( 'change', () => {
        const country_default_divider = document.querySelector( '#country_default-divider' );
        country_default_divider.remove();
        profileCountrySelectDefault.remove();
    });
}


/// ----
// Post to profile
// show submit button if active and length is > 0 to prevent blank posts
const postToProfileForm = document.querySelector( 'form#postToProfile__form' );
const postToProfileInput = document.querySelector( '#postToProfile__form textarea' );
const postToProfileSubmit = document.querySelector( '#postToProfile__form button[type="submit"]' );
const postToProfileFile = document.querySelector( '#postToProfile__form input[type="file"]' );
const postToProfileFileTrigger = document.querySelector( '#file-trigger' );
const removePostImage = document.querySelector('#remove_post_image');

function showSubmitButton() {
    postToProfileSubmit.classList.remove( 'd-none' );
    postToProfileSubmit.classList.add( 'd-block' );
}

function hideSubmitButton() {
    postToProfileSubmit.classList.remove( 'd-block' );
    postToProfileSubmit.classList.add( 'd-none' );
}

if ( postToProfileInput ) {
    postToProfileInput.addEventListener( 'focus', function() {
        postToProfileInput.addEventListener( 'keyup', function() {
            if ( postToProfileInput.value.length > 0 || postToProfileFile.value != '' ) {
                showSubmitButton();
            } else {
                hideSubmitButton();
            }
        });
    });

    postToProfileFileTrigger.addEventListener( 'click', function() {
        postToProfileFile.click();
    });

    postToProfileFile.addEventListener( 'change', function() {
        if ( postToProfileInput.value.length == 0 ) {
            showSubmitButton();           
        }
        postToProfileForm.setAttribute( 'action', '/create-new-post-with-image');
        postToProfileForm.setAttribute( 'enctype', 'multipart/form-data');
    });

    removePostImage.addEventListener( 'click', function() {
        if ( postToProfileInput.value.length == 0 ) {
            hideSubmitButton();            
        }
        postToProfileForm.setAttribute( 'action', '/create-new-post');
        postToProfileForm.removeAttribute( 'enctype' );
        postToProfileFile.value = '';
        uploadPreviewContainer.style.display = 'none';
        uploadPreview.setAttribute( 'src', '' );

    });
}


// ----
// Comment Forms
const commentForm = document.querySelectorAll( 'form.comment_form' );

if ( commentForm ) {

    [].forEach.call(commentForm, function( form ) {
        let get_id = form.getAttribute( 'id' );
        let textarea = document.querySelector( `#${get_id} textarea` );
        let button = document.querySelector( `#${get_id} button[type='submit']` );

        textarea.addEventListener( 'keyup', function() {
            if ( textarea.value.length > 0 ) {
                button.style.display = 'inline-block';
            } else {
                button.style.display = 'none';
            }
        });

    });

}

// ----
// Reply Forms
const replyTrigger = document.querySelectorAll( 'button.reply_trigger' );
if ( replyTrigger ) {

    [].forEach.call( replyTrigger, function( trigger ) {
        trigger.addEventListener( 'click', function() {
            let findForm = trigger.getAttribute( 'data-reply' );
            let replyForm = document.querySelector( `#comment_form_${findForm}` );
            replyForm.style.display = 'block';
        });
    });
}


// ----
// Password Strength 
const passwordInput = document.querySelector( 'input#password' );
const passwordConfirmInput = document.querySelector( 'input#password-confirm' );
const passwordStrengthMeter = document.querySelector( 'div#passwordStrengthMeter' );
let strengthScore = 0;
let passwordValue;
let passwordConfirmValue;
const passwordChecklist = document.querySelector( '#password-checklist' );

const passEightChars = document.querySelector( '#password-eight-chars' );
const passTwelveChars = document.querySelector( '#password-twelve-chars' );
const passOneNum = document.querySelector( '#password-one-num' );
const passMoreNum = document.querySelector( '#password-more-num' );
const passOneCap = document.querySelector( '#password-one-cap' );
const passMoreCap = document.querySelector( '#password-more-cap' );
const passOneSpec = document.querySelector( '#password-one-spec' );
const passMoreSpec = document.querySelector( '#password-more-spec' );


function passwordCheck( check ) {
    check.forEach.call(check, function(toCheck) {
        toCheck.classList.remove('password-uncheck');
        toCheck.classList.add( 'password-check' );
    });

}

function passwordUncheck( uncheck ) {
    uncheck.classList.remove( 'password-check' );
    uncheck.classList.add( 'password-uncheck' );
}

if ( passwordInput && passwordStrengthMeter ) {
    const submitButton = document.querySelector( 'form.account-form button[type="submit"]' );

    passwordInput.addEventListener( 'focus', function() {
        passwordInput.addEventListener( 'keyup', function() {

            strengthScore = 0;
            passwordStrengthMeter.innerHTML = '';
            
            passwordValue = passwordInput.value;

            if ( passwordValue.length >= 12 ) {
                strengthScore = strengthScore + 2;
                passwordCheck( [passEightChars, passTwelveChars] );
            } else if ( passwordValue.length >= 8 ) {
                strengthScore = strengthScore + 1;
                passwordCheck( [passEightChars] );
                passwordUncheck( passTwelveChars );
            } else {
                strengthScore = strengthScore + 0;
                passwordUncheck( passEightChars );
            }

            let specialChars = passwordValue.replace(/[\w \d]/gi, "");
            specialChars = specialChars.length;

            if ( specialChars >= 2 ) {
                strengthScore = strengthScore + 2;
                passwordCheck( [passOneSpec, passMoreSpec] );
            } else if ( specialChars === 1 ) {
                strengthScore = strengthScore + 1;
                passwordCheck( [passOneSpec] );
                passwordUncheck( passMoreSpec );
            } else {
                strengthScore = strengthScore + 0;
                passwordUncheck( passOneSpec );
            }

            let numbers = passwordValue.replace(/[\D]/g, "");
            numbers = numbers.length;

            if ( numbers >= 2 ) {
                strengthScore = strengthScore + 2;
                passwordCheck( [passOneNum, passMoreNum] );
            } else if ( numbers === 1 ) {
                strengthScore = strengthScore + 1;
                passwordCheck( [passOneNum] );
                passwordUncheck( passMoreNum );
            } else {
                strengthScore = strengthScore + 0;
                passwordUncheck( passOneNum );
            }

            let capitals = passwordValue.replace(/[^ABCDEFGHIJKLMNOPQRSTUVWXYZ]/g, "");
            capitals = capitals.length;

            if ( capitals >= 2 ) {
                strengthScore = strengthScore + 2;
                passwordCheck( [passOneCap, passMoreCap] );
            } else if ( capitals === 1 ) {
                strengthScore = strengthScore + 1;
                passwordCheck( [passOneCap] );
                passwordUncheck( passMoreCap );
            } else {
                strengthScore = strengthScore + 0;
                passwordUncheck( passOneCap );
            }

            let strengthColor = 'rgba(230,55,87,0.5)';

            if ( strengthScore == 8 ) {
                strengthColor = 'rgba(0,217,126,1)'; 
            } else if ( strengthScore >= 6  ) {
                strengthColor = 'rgba(0,217,126,0.75)'; 
            } else if ( strengthColor >= 2 ) {
                strengthColor = 'rgba(246,195,67,0.5)'; 
            } else if ( strengthColor >= 0 ) {
                strengthColor = 'rgba(230,55,87,0.25)';
            }

            let i = 0;
            let progressHTML = '';

            while ( i <= strengthScore ) {
                progressHTML = progressHTML + 
                    `<div   class="progress-bar" 
                            role="progressbar" 
                            style="width:12.5%; 
                            background-color:${strengthColor};"></div>`;
                i++;
            }

            passwordStrengthMeter.innerHTML = progressHTML;


        });
    });

    passwordConfirmInput.addEventListener( 'focus', function(){
        passwordConfirmInput.addEventListener( 'keyup', function() {
            passwordConfirmValue = passwordConfirmInput.value;     
            if ( passwordValue == passwordConfirmValue ) {
                submitButton.removeAttribute( 'disabled' );
            } else {
                submitButton.disabled = true;
            }
        });
    });


}


// ----
// Disabling Social Nav links if no href provided
const socialNav = document.querySelector( '.profile__social-nav' );
if ( socialNav ) {
    const socialNavLinks = document.querySelectorAll( '.profile__social-nav a' );
    [].forEach.call(socialNavLinks, function( link ) {
        let href = link.getAttribute( 'href' );
        if ( href === '' || href == null || href == undefined ) {
            link.addEventListener( 'click', function(e) {
                e.preventDefault();
            });
        }
    });
}


// ----
// Deadsea Update Form scripts
const deadSeaForm = document.querySelector( '.deadsea-form' );

if ( deadSeaForm ) {

    const fileInput = document.querySelector( 'input.deadseaUpdateImage' );
    // Change enctype for form if an image is added
    fileInput.addEventListener( 'change', () => {
        let enctype = deadSeaForm.getAttribute( 'enctype' );
        
        if ( enctype ) {
            deadSeaForm.removeAttribute( 'enctype' );
            deadSeaForm.setAttribute( 'action', '/new_deadsea_update' );
        } else {
            deadSeaForm.setAttribute( 'enctype', 'multipart/form-data');
            deadSeaForm.setAttribute( 'action', '/new_deadsea_update_with_image' );
        }
        
    });

    // Get current location for update
    const getLocationTrigger = document.querySelector( 'button#get_location' );
    const lng = document.querySelector( 'input#lng' );
    const lat = document.querySelector( 'input#lat' );

    getLocationTrigger.addEventListener( 'click', ( e ) => {
        e.preventDefault();

        function success( position ) {
            let latitude = position.coords.latitude;
            let longitude = position.coords.longitude;

            lat.value = latitude;
            lng.value = longitude;

            $('#modalLoading').modal('hide');
        }

        function error() {
            alert( 'Sorry! Your location could not be found. Please check your browser settings and/or connection.' );
            $('#modalLoading').modal('hide');
        }

        navigator.geolocation.getCurrentPosition( success, error );

    });
}


// ----
// Post Image Lightbox
const lightboxTrigger = document.querySelectorAll( '.lightbox_trigger' );
if ( lightboxTrigger ) {
    const lightbox = document.querySelector( '.modal-lightbox img' );
    [].forEach.call( lightboxTrigger, function( trigger ) {
        trigger.addEventListener( 'click', function( e ) {
            e.preventDefault();
            let image = this.getAttribute( 'data-lightbox-source' );
            lightbox.setAttribute( 'src', image );
        });
    });
}


// ----
// Course / Module Form entype update
const courseForm = document.querySelector( '.course-form' );

if ( courseForm ) {

    const courseImageInput = document.querySelector( '.course-form input[type=file]' );

    courseImageInput.addEventListener( 'change', () => {
        let enctype = courseForm.getAttribute( 'enctype' );
        
        if ( enctype ) {
            courseForm.removeAttribute( 'enctype' );
        } else {
            courseForm.setAttribute( 'enctype', 'multipart/form-data');
        }
        
    });
}


// ----
// Settings : Privacy Control
const privacy_label = document.querySelector( '#privacy_label' );
const privacy_toggle = document.querySelector( '#privacy' );

if ( privacy_label && privacy_toggle ) {
    privacy_label.addEventListener( 'click', function() {
        privacy_toggle.toggleAttribute( 'checked' );
    });
}