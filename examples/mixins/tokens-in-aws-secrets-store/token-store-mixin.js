const debug = require('debug');
const ChipChat = require('chipchat');
const AWSSecretsManager = require('aws-sdk/clients/secretsmanager');

const log = debug('aws-secrets: store:');
const region = 'eu-west-3';
const secretsClient = new AWSSecretsManager({ region });

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
                const answer = await secretsClient.getSecretValue({ SecretId: `${tokenid}_tokens` }).promise(); // From secrest store;
                tokens = JSON.parse(answer.SecretString);
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
            await secretsClient.updateSecret({ SecretId: `${tokenid}_tokens`, SecretString: JSON.stringify(tokens) }).promise();
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
