const swal = require( 'sweetalert' );

const alertForms = document.querySelectorAll( 'form[data-alert="true"]' );

if ( alertForms ) {

    [].forEach.call( alertForms, function( form ) {
        form.addEventListener( 'submit', function( e ) {
            e.preventDefault();

            let form = this;
            let alert_text = this.getAttribute( 'data-alert-text' );
            let alert_icon = this.getAttribute( 'data-alert-icon' );

            swal({
                text: alert_text,
                buttons: true,
                icon: alert_icon,
                dangerMode: true
            }).then( ( confirm ) => {
                if ( confirm ) {
                    form.submit();
                } else {
                    $('#modalLoading').modal('hide');
                    return;
                }
            });

        });
    });

}