const debug = require('debug');
const ChipChat = require('chipchat');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient();
const log = debug('google-secrets: store:');
const storename = `projects/${process.env.GOOGLEPROJECT}/secrets`;

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
                const [secret] = await client.accessSecretVersion({ name: `${storename}/${tokenid}_tokens/versions/latest` });
                if (secret.payload && secret.payload.data) {
                    tokens = secret.payload.data.toString();
                    tokens = JSON.parse(tokens);
                    cache[`${tokenid}_token`] = tokens;
                } else {
                    tokens = {};
                }
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
            await client.addSecretVersion({
                parent: `${storename}/${tokenid}_tokens`,
                payload: {
                    data: Buffer.from(tokens, 'utf8')
                }
            });
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
