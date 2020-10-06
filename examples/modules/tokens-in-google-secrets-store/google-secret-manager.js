const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const debug = require('debug');

const client = new SecretManagerServiceClient();
const getStore = (opts) => {
    const name = `projects/${opts.project || process.env.GOOGLEPROJECT}/secrets`;
    const log = debug(`google-secrets: store: initilizing ${name}`);
    return {
        get: async (key) => {
            log('get', key);
            let answer;
            const [secret] = await client.accessSecretVersion({ name: `${name}/${key}/versions/latest` });
            if (secret.payload && secret.payload.data) {
                answer = secret.payload.data.toString();
            }
            return answer;
        },
        set: async (key, data) => {
            await client.addSecretVersion({
                parent: `${name}/${key}`,
                payload: {
                    data: Buffer.from(data.token, 'utf8')
                }
            });
        }
    };
};
module.exports = { getStore };
