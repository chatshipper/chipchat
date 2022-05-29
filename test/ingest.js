const assert = require('assert');
// const { getTokens, setTokens, clearCache: clearTokenCache } = require('chipchat-tokens-to-google-secretmanager-mixin');
// const got = require('got');

// const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

delete require.cache[require.resolve('../lib/chipchat')]; //load fresh chipchat
const Bot = require('../lib/chipchat');

delete require.cache[require.resolve('../lib/chipchat')]; //load fresh chipchat
const MixinBot = require('../lib/chipchat');

// MixinBot.mixin({ getTokens, setTokens });
const TOKEN = process.env.CS_TOKEN;
const REFRESHTOKEN = process.env.CS_REFRESHTOKEN;
const USER = process.env.CS_USER || '5ee731deb306f000111815db';
// const HOST = process.env.CS_APIHOST || 'https://api.web1on1.chat';
if (!TOKEN || !REFRESHTOKEN) {
    throw new Error('WARNING: please add test token env var TOKEN and REFRESHTOKEN');
}
const SDKADMINID = process.env.CS_ADMIN || '5ee7372448d9940011151f42';
// const SDKPASSWORD = process.env.CS_ADMIN_PASSWORD;
const SDKADMINEMAIL = process.env.CS_ADMIN_USER || 'bot+5ee7372448d9940011151f42@web1on1.chat';

// const client = new SecretManagerServiceClient();

const DEFAULTAPIOPTIONS = {
    token: TOKEN,
    refreshToken: REFRESHTOKEN,
    email: SDKADMINEMAIL,
    preloadBots: false
};
let bot;

assert.ok((TOKEN && USER));

describe('bot.ingest', () => {
    describe('possible errors', () => {
        it('should generate an error when the payload is empty', (done) => {
            bot = new Bot();
            bot.on('error', (error) => {
                assert.deepStrictEqual(error, { type: 'ingest', message: 'Invalid payload, missing event' });
                done();
            });
            bot.ingest();
        });
        it('should generate an error when the event is missing on the payload', (done) => {
            bot = new Bot();
            bot.on('error', (error) => {
                assert.deepStrictEqual(error, { type: 'ingest', message: 'Invalid payload, missing event' });
                done();
            });
            const payload = {};
            bot.ingest(payload);
        });
        it('should generate an error when an message event arrives without a conversation in the payload', (done) => {
            bot = new Bot();
            bot.on('error', (error) => {
                assert.deepStrictEqual(error, { type: 'ingest', message: 'Invalid payload, missing conversation' });
                done();
            });
            const payload = { event: 'message.create.contact.chat' };
            bot.ingest(payload);
        });
    });
    describe('active middleware', () => {
        it('should ignore message from self (ignoreSelfMiddleware)', () => {
            bot = new Bot(DEFAULTAPIOPTIONS);
            bot.on('message', (message, conversation) => {
                //should not receive the message as the user is the token user
                assert.deepStrictEqual(null, message, `should not receive this message: ${conversation.id}, ${message.text}`);
            });
            bot.on('error', (error) => {
                //should not get here, no errors were triggered
                assert.deepStrictEqual(null, error, `should not give this error: ${error.message}`);
            });
            const payload = { event: 'message.create.contact.chat', data: { conversation: { id: 123456, organization: 12345 }, message: { conversation: 123456, user: SDKADMINID, text: 'hi' } } };
            bot.ingest(payload);
        });
        it('should not ignore message from self when ignoreSelf is disabled', () => {
            bot = new Bot(Object.assign({}, DEFAULTAPIOPTIONS, { ignoreSelf: false }));
            const payload = { event: 'message.create.contact.chat', data: { conversation: { id: 123456, organization: 12345 }, message: { conversation: 123456, user: USER, text: 'hi' } } };
            bot.on('message', (message, conversation) => {
                //should receive the message
                const { id, organization } = conversation;
                assert.deepStrictEqual(payload.data.message, message);
                assert.deepStrictEqual(payload.data.conversation, { id, organization });
            });
            bot.on('error', (error) => {
                //should not have errors
                assert.deepStrictEqual(null, error, `should not give this error: ${error.message}`);
            });
            bot.ingest(payload);
        });
        it('should ignore message from other bots (ignoreBotsMiddleware)', () => {
            bot = new Bot(DEFAULTAPIOPTIONS);
            bot.on('message', (message, conversation) => {
                //should not receive the message as the user is the token user
                assert.deepStrictEqual(null, message, `should not receive this message: ${conversation.id}, ${message.text}`);
            });
            bot.on('error', (error) => {
                //should not have errors
                assert.deepStrictEqual(null, error, `should not give this error: ${error.message}`);
            });
            const payload = { event: 'message.create.contact.chat', data: { conversation: { id: 123456, organization: 12345 }, message: { conversation: 123456, user: '', role: 'bot', text: 'hi' } } };
            bot.ingest(payload);
        });
        it('should not ignore message from other bots when ignoreBots is disabled', () => {
            bot = new Bot(Object.assign({}, DEFAULTAPIOPTIONS, { ignoreSelf: false }));
            const payload = { event: 'message.create.contact.chat', data: { conversation: { id: 123456, organization: 12345 }, message: { conversation: 123456, user: '', role: 'bot', text: 'hi' } } };
            bot.on('message', (message, conversation) => {
                //should receive the message
                const { id, organization } = conversation;
                assert.deepStrictEqual(payload.data.message, message);
                assert.deepStrictEqual(payload.data.conversation, { id, organization });
            });
            bot.on('error', (error) => {
                //should not have errors
                assert.deepStrictEqual(null, error, `should not give this error: ${error.message}`);
            });
            bot.ingest(payload);
        });
    });
    describe('valid messages', () => {
        it('should proces valid messages', () => {
            bot = new Bot({ ...DEFAULTAPIOPTIONS });

            const payload = { event: 'message.create.contact.chat', organization: 12345, data: { conversation: { id: 123456, organization: 12345 }, message: { conversation: 123456, user: '', role: 'agent', text: 'hi' } } };
            bot.on('message', (message, conversation) => {
                //should receive the message
                const { id, organization } = conversation;
                assert.deepStrictEqual(payload.data.message, message);
                assert.deepStrictEqual(payload.data.conversation, { id, organization });
            });
            bot.on('error', (error) => {
                //should not get here, no errors were triggered
                assert.deepStrictEqual(null, error, `should not give this error: ${error.message}`);
            });
            bot.ingest(payload);
        });
    });
    describe('using async', () => {
        it('should not return promise when not using async', () => {
            bot = new Bot({ ...DEFAULTAPIOPTIONS });
            const payload = { event: 'message.create.contact.chat', organization: 12345, data: { conversation: { id: 123456, organization: 12345 }, message: { conversation: 123456, user: '', role: 'agent', text: 'hi' } } };
            bot.on('message', (message, conversation) => {
                //should receive the message
                const { id, organization } = conversation;
                assert.deepStrictEqual(payload.data.message, message, 'is not the same');
                assert.deepStrictEqual(payload.data.conversation, { id, organization });
            });
            bot.on('error', (error) => {
                //should not get here, no errors were triggered
                assert.deepStrictEqual(null, error, `should not give this error: ${error.message}`);
            });
            const promise = bot.ingest(payload);
            assert.deepStrictEqual(typeof promise, 'undefined', 'it should NOT have returned anything');
        });
        it('should return promise when using async', () => {
            bot = new Bot({ ...DEFAULTAPIOPTIONS });
            const payload = { event: 'message.create.contact.chat', organization: 12345, data: { conversation: { id: 123456, organization: 12345 }, message: { conversation: 123456, user: '', role: 'agent', text: 'hi' } } };
            bot.on('message', (message, conversation) => {
                //should receive the message
                const { id, organization } = conversation;
                assert.deepStrictEqual(payload.data.message, message);
                assert.deepStrictEqual(payload.data.conversation, { id, organization });
            });
            bot.on('error', (error) => {
                //should not get here, no errors were triggered
                assert.deepStrictEqual(null, error, `should not give this error: ${error.message}`);
            });
            const promise = bot.ingest(payload, null, { async: true });
            assert.deepStrictEqual(typeof promise.then, 'function', 'it should have returned a promise');
            return promise.then(() => { return true; }).catch((e) => assert(true, false, 'it should not end up here', e));
        });
        it('should return promise when using async and all possible matchers', () => {
            bot = new Bot({ ...DEFAULTAPIOPTIONS });
            const payload = { event: 'message.create.contact.chat', organization: 12345, data: { conversation: { id: 123456, organization: 12345 }, message: { type: 'chat', conversation: 123456, user: '', role: 'agent', text: 'hi' } } };
            let matched = 0;
            bot.registerCallback('test', () => {
                matched += 1;
            });
            bot.on('**.chat', (message, conversation) => {
                const { id, organization } = conversation;
                matched += 1;
                assert.deepStrictEqual(payload.data.message, message);
                assert.deepStrictEqual(payload.data.conversation, { id, organization });
            });
            bot.on('message.create.contact.chat', (message, conversation) => {
                matched += 1;
                const { id, organization } = conversation;
                assert.deepStrictEqual(payload.data.message, message);
                assert.deepStrictEqual(payload.data.conversation, { id, organization });
            });
            bot.on('message.create.*.chat', (message, conversation) => {
                matched += 1;
                const { id, organization } = conversation;
                assert.deepStrictEqual(payload.data.message, message);
                assert.deepStrictEqual(payload.data.conversation, { id, organization });
            });
            bot.on('**.chat', (message, conversation) => {
                matched += 1;
                const { id, organization } = conversation;
                assert.deepStrictEqual(payload.data.message, message);
                assert.deepStrictEqual(payload.data.conversation, { id, organization });
            });
            bot.on('**.chat', { text: /hi/ }, (message, conversation) => {
                matched += 1;
                const { id, organization } = conversation;
                assert.deepStrictEqual(payload.data.message, message);
                assert.deepStrictEqual(payload.data.conversation, { id, organization });
            });
            bot.onText(/hi/, (message, conversation) => {
                matched += 1;
                const { id, organization } = conversation;
                assert.deepStrictEqual(payload.data.message, message);
                assert.deepStrictEqual(payload.data.conversation, { id, organization });
            });
            bot.onText('hi', (message, conversation) => {
                matched += 1;
                const { id, organization } = conversation;
                assert.deepStrictEqual(payload.data.message, message);
                assert.deepStrictEqual(payload.data.conversation, { id, organization });
            });
            bot.on('message', 'test');
            bot.onText(/hi/, 'test');
            bot.on('error', (error) => {
                //should not get here, no errors were triggered
                assert.deepStrictEqual(null, error, `should not give this error: ${error.message}`);
            });
            const promise = bot.ingest(payload, null, { async: true });
            assert.deepStrictEqual(typeof promise.then, 'function', 'it should have returned a promise');
            return promise.then((...data) => {
                assert.deepStrictEqual(data, [undefined], 'it should return an empty array');
            }).catch((error) => assert.deepStrictEqual(null, error, `it should not end up here: ${error.message}`)).then(() => {
                assert.deepStrictEqual(matched, 9, 'it should have passed along all matches');
            });
        });
    });
    describe('using chipchat-tokens-to-google-secretmanager-mixin', () => {
        // it('mixin setTokens should work', async () => {
        //     await client.deleteSecret({ name: `projects/cs-microservices/secrets/${SDKADMINID}_tokens` }).catch(() => null);
        //     const { body } = await got.post(`${HOST}/v2/auth/token`, { json: { email: SDKADMINEMAIL, password: SDKPASSWORD }, responseType: 'json' });
        //     const tokens = await setTokens(body, false);
        //     assert.deepStrictEqual(tokens.user, SDKADMINID, 'it got the correct user');
        // });
        // it('should work with mixin', async () => {
        //     clearTokenCache();
        //     bot = new MixinBot({
        //         email: SDKADMINEMAIL,
        //         preloadBots: false
        //     });
        //     const user = await bot.users.get(SDKADMINID);
        //     assert.deepStrictEqual(user.email, SDKADMINEMAIL, 'it got the correct user');
        // });
        // it('should work getting tokens many times from store', async () => {
        //     for await (const it of Array.from(Array(20).keys())) { // eslint-disable-line
        //         const startAt = new Date();
        //         clearTokenCache();
        //         bot = new MixinBot({
        //             email: SDKADMINEMAIL,
        //             preloadBots: false
        //         });
        //         await bot.users.get(SDKADMINID);
        //         const timeItTook = (new Date() - startAt) / 1000;
        //         assert(timeItTook < 3, `it should be fast, not ${timeItTook} secs`);
        //     }
        // });
        it('should work with ignoreUnjoined', async () => {
            const payload = { event: 'message.create.contact.chat', organization: 12345, data: { conversation: { id: 123456, organization: 12345, participants: [] }, message: { type: 'chat', conversation: 123456, user: '', role: 'agent', text: 'hi' } } };
            let matched = 0;
            bot = new MixinBot({
                email: SDKADMINEMAIL,
                ignoreUnjoined: true,
                preloadBots: false
            });
            bot.on('message.create.contact.chat', (message, conversation) => {
                matched += 1;
                const { id, organization } = conversation;
                assert.deepStrictEqual(payload.data.message, message);
                assert.deepStrictEqual(payload.data.conversation, { id, organization });
            });
            const promise = bot.ingest(payload, null, { async: true });
            return promise.then(() => {
                assert.deepStrictEqual(matched, 0, 'should not process the event');
            });
        });
    });
});
