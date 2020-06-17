const assert = require('assert');
const Bot = require('../lib/chipchat');

const USER = '5b110daee70baa485b1b16ba';

const TOKEN = process.env.TOKEN;
const REFRESHTOKEN = process.env.REFRESHTOKEN;
if (!TOKEN || !REFRESHTOKEN) {
    throw new Error('WARNING: please add test token env var TOKEN and REFRESHTOKEN');
}
const SDKADMINID = '5ee7372448d9940011151f42';
const SDKADMINEMAIL = 'mischa+sdkadmin@chatshipper.com';
const DEFAULTAPIOPTIONS = { token: TOKEN, refreshToken: REFRESHTOKEN, email: SDKADMINEMAIL };
/*
const bot = new Bot({
    token: TOKEN,
    middleware: {
        send: [
            (b, payload, next) => { // eslint-disable-line
                console.log(`------->send ${payload.text}`);
                //next();
            }
        ],
        receive: (bot, payload, next) => { // eslint-disable-line
            console.log(`-------->receive ${payload.text}`);
            next();
        }
    }
});
*/
describe('bot.ingest', () => {
    describe('possible errors', () => {
        it('should generate an error when the payload is empty', (done) => {
            const bot = new Bot();
            bot.on('error', (error) => {
                assert.deepStrictEqual(error, { type: 'ingest', message: 'Invalid payload, missing event' });
                done();
            });
            bot.ingest();
        });
        it('should generate an error when the event is missing on the payload', (done) => {
            const bot = new Bot();
            bot.on('error', (error) => {
                assert.deepStrictEqual(error, { type: 'ingest', message: 'Invalid payload, missing event' });
                done();
            });
            const payload = {};
            bot.ingest(payload);
        });
        it('should generate an error when an message event arrives without a conversation in the payload', (done) => {
            const bot = new Bot();
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
            const bot = new Bot(DEFAULTAPIOPTIONS);
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
            const bot = new Bot(Object.assign({}, DEFAULTAPIOPTIONS, { ignoreSelf: false }));
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
            const bot = new Bot(DEFAULTAPIOPTIONS);
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
            const bot = new Bot(Object.assign({}, DEFAULTAPIOPTIONS, { ignoreSelf: false }));
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
        const bot = new Bot(DEFAULTAPIOPTIONS);
        const payload = { event: 'message.create.contact.chat', data: { conversation: { id: 123456, organization: 12345 }, message: { conversation: 123456, user: '', role: 'agent', text: 'hi' } } };
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
