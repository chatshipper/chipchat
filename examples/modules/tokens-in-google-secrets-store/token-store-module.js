const debug = require('debug');
const log = debug('google-secrets: store:');

const { getStore } = require('./google-secret-manager');
const { get, set } = getStore({ project: 'cs-microservices' });

module.exports = (api, options) => {
    // We will still use the original functions.
    log('module googlesecrets initilizing');
    const cachedGetTokens = api.getTokens.bind(api);
    const cachedSetTokens = api.setTokens.bind(api);
    let tokenid; // this is the name of the token in the store
    // check if we have either tokens or a tokenid
    if (options.tokenid) {
        tokenid = options.tokenid;
    } else {
        cachedGetTokens().then((tokens) => {
            if (tokens) {
                const payload = tokens.token.split('.')[1];
                const botid = JSON.parse(Buffer.from(payload, 'base64').toString())._id
                tokenid = botid;
            } else {
                throw new Error('neither tokens, nor a tokenid is specified');
            }
        });
    }

    api.getTokens = async () => {
        log('getTokens');
        const cached_tokens = await cachedGetTokens();
        if (cached_tokens) {
            log('getTokens: using cached tokens');
            return Promise.resolve(cached_tokens); // Internal cache
        }
        log('getTokens: get tokens tokens from store');
        const token = await get(`${tokenid}_token`); // From secret store
        const refreshToken = await get(`${tokenid}_refreshToken`); // From secret store
        await cachedSetTokens({ token, refreshToken });
        return { token, refreshToken };
    }
    api.setTokens = async (tokens) => {
        await cachedSetTokens(tokens); // Update internal cache
        await set(`${tokenid}_token`, tokens.token); // Update store
        await set(`${tokenid}_refreshToken`, tokens.refreshToken); // Update store
    }
};

