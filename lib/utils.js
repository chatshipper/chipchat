const crypto     = require('crypto');

/**
   Calculate the X-Hub-Signature header value.
   @param {buffer} buff - Crypto usable buffer for signature generation
   @param {string} key - Hmac compatible key for signature
*/
exports.getSignature = (buf, key) => {
    const hmac = crypto.createHmac('sha1', key);
    hmac.update(buf, 'utf-8');
    return `sha1=${hmac.digest('hex')}`;
};
