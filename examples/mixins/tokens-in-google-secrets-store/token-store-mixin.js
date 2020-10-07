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
            let tokens = cache[`${tokenid}_tokens`];
            if (tokens) {
                log('tokens from cache');
            } else {
                tokens = await get(`${tokenid}_tokens`); // From secret store
                tokens = JSON.parse(tokens);
                cache[`${tokenid}_token`] = tokens;
            }
            return tokens;
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
            await set(`${tokenid}_tokens`, tokens); // Update store
            cache[`${tokenid}_tokens`] = tokens; // Update cache
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
