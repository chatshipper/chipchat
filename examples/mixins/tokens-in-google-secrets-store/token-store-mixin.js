const debug = require('debug');
const ChipChat = require('chipchat');
const { getStore } = require('./google-secret-manager');

const log = debug('google-secrets: store:');
const { get, set } = getStore({ project: process.env.GOOGLEPROJECT });

const cache = {};

async function getTokens() {
    if (this.auth.email) {
        const tokenid = this.auth.email.split(/\+|@/)[1];
        log(`getTokens: using tokenid ${tokenid}`);
        try {
            let token = cache[`${tokenid}_token`];
            if (token) {
                log('token from cache');
            } else {
                token = await get(`${tokenid}_token`); // From secret store
                cache[`${tokenid}_token`] = token;
            }
            let refreshToken = cache[`${tokenid}_refreshToken`];
            if (refreshToken) {
                log('refreshToken from cache');
            } else {
                refreshToken = await get(`${tokenid}_refreshToken`); // From secret store
                cache[`${tokenid}_refreshToken`] = refreshToken;
            }
            return { token, refreshToken };
        } catch (e) {
            log(`getTokens: darn, something went wrong: ${e}`);
            return {};
        }
    }
    throw new Error('token store mixin: Must provide valid email');
}

async function setTokens(tokens) {
    const tokenid = (ChipChat.decodeJwt(tokens) || {})._id;
    if (tokenid) {
        log(`setTokens: using tokenid ${tokenid}`);
        try {
            await set(`${tokenid}_token`, tokens.token); // Update store
            await set(`${tokenid}_refreshToken`, tokens.refreshToken); // Update store
        } catch (e) {
            log(`setTokens: darn, something went wrong: ${e}`);
        }
    } else {
        throw new Error('token store mixin: Must provide token');
    }
}

module.exports = {
    getTokens,
    setTokens
};
