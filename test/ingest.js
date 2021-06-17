const assert = require('assert');
const Bot = require('../lib/chipchat');

const TOKEN = process.env.CS_TOKEN;
const REFRESHTOKEN = process.env.CS_REFRESHTOKEN;
const USER = process.env.CS_USER || '5ee731deb306f000111815db';
//const HOST = process.env.CS_APIHOST || 'https://api.chatshipper.com';
if (!TOKEN || !REFRESHTOKEN) {
    throw new Error('WARNING: please add test token env var TOKEN and REFRESHTOKEN');
}

const SDKADMINID = process.env.CS_ADMIN || '5ee7372448d9940011151f42';
const SDKADMINEMAIL = process.env.CS_ADMIN_EMAIL || 'mischa+sdkadmin@chatshipper.com';
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
});
