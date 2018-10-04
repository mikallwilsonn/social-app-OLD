const nodemailer = require( 'nodemailer' );
const pug = require( 'pug' );
const htmlToText = require( 'html-to-text' );
const juice = require( 'juice' );
const promisify = require( 'es6-promisify' );

const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

const generateHTML = ( filename, options = {} ) => {
    const html = pug.renderFile( `${__dirname}/../views/email/${filename}.pug`, options );
    const inlined = juice( html );
    return inlined;
}

exports.send = async ( options ) => {
    const html = generateHTML( options.filename, options );
    const text = htmlToText.fromString( html );
    const mailOptions = {
        from: 'Social App <noreply@socialapp.com>',
        to: options.to,
        subject: options.subject,
        html,
        text
    };

    const sendMail = promisify( transport.sendMail, transport );
    return sendMail( mailOptions );
};