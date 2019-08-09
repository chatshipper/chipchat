/* eslint no-plusplus:0 */
const assert = require('assert');
const mock = require('mock-require');
const sinon = require('sinon');

//multi file reset
sinon.restore();
mock.stopAll();

// no real world requests, we replace request-promise that chipchat uses for a stub
const request = sinon.stub();
mock('request-promise', request);

const Bot = require('../lib/chipchat');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjExMGRhZWU3MGJhYTQ4NWIxYjE2YmEiLCJvcmdhbml6YXRpb24iOiI1OTc4YmY0YjAyOTY0MDRlNmY5OTQ3ZTUiLCJzY29wZSI6InZpZXdlciBndWVzdCBhZ2VudCBib3QgYWRtaW4iLCJpYXQiOjE1NjQ1NjkzMDMsImV4cCI6MTU2NDY1NTcwM30.2q6isPDL5uMwtnyThVGN8Hq9UMqhzAkf72mZdVrSFgc';
const USER = '5b110daee70baa485b1b16ba';

const METHODS = ['create', 'delete', 'get', 'list', 'update'];
const RESOURCES = [
    'users', 'channels', //'usergroups',
    'contacts', 'conversations', 'messages',
    'organizations', 'orggroups', 'services', 'forms',
    'workflows', 'metrics',
    'kbases', 'kbitems', 'articles', 'files'
];
//const wait = ms => new Promise(resolve => setTimeout(resolve), ms);
const equal = assert.deepStrictEqual;
//use it.only to run one test

describe('Client tests', () => {
    describe('A bot should have all the resources', () => {
        RESOURCES.forEach((resource) => {
            it(`${resource} has all its methods`, () => {
                const bot = new Bot();
                equal(Object.keys(bot[resource]).sort(), METHODS);
            });
        });
    });
    describe('Requesting recource endpoints', () => {
        it('A bot\'s resource should return a promise when no callback is passed', () => {
            const bot = new Bot({ token: TOKEN });
            request.resetHistory();
            request.resolves(true);
            return bot.users.get('123456').then(() => {
                equal(request.calledOnce, true);
            });
        });
        it('A bot\'s resource should not return a promise when a callback is passed', (done) => {
            const bot = new Bot({ token: TOKEN });
            request.resetHistory();
            request.resolves(true);
            const answer = bot.users.get('123456', () => {
                equal(request.calledOnce, true);
                done();
            });
            // no promise is return when using a callback
            equal(answer, null, 'should not return a promise');
        });
    });
    describe('Using send to add a message to a conversation', () => {
        it('A promise is return when not using a callback', (done) => {
            const bot = new Bot({ token: TOKEN });
            request.resetHistory();
            request.resolves(true);
            const payload = {};
            bot.send('convid', payload).then(() => {
                equal(request.calledOnce, true);
                done();
            }).catch((e) => {
                equal(true, false, `should not have error ${e}`);
            });
        });
        it('No promise is returned when using a callback', (done) => {
            const bot = new Bot({ token: TOKEN });
            request.resetHistory();
            request.resolves(true);
            const payload = {};
            const notPromise = bot.send('convid', payload, () => {
                equal(request.calledOnce, true);
                done();
            });
            // no promise is return when using a callback
            equal(notPromise, null, 'should not return a promise');
        });
        it('You can send a text direcly', (done) => {
            const bot = new Bot({ token: TOKEN });
            request.resetHistory();
            request.resolvesArg(0);
            bot.send('convid', 'hi there').then((usedPayload) => {
                equal(request.calledOnce, true);
                equal(usedPayload.body.text, 'hi there');
                done();
            });
        });
        it('You can send a text direcly', () => {
            const bot = new Bot({ token: TOKEN });
            request.resetHistory();
            request.resolvesArg(0);
            return bot.send('convid', 'hi there').then((usedPayload) => {
                equal(request.calledOnce, true);
                equal(usedPayload.body.text, 'hi there');
            });
        });
    });
    describe('Using say on the context to add a message to a conversation', () => {
        it('By using the Promise variant', async () => {
            const bot = new Bot({ token: TOKEN, ignoreSelf: false });
            const payload = { event: 'message.create.contact.chat', data: { conversation: { id: 123456, organization: 12345 }, message: { conversation: 123456, user: USER, text: 'hi' } } };
            request.resetHistory();
            request.resolvesArg(0);
            bot.on('message', async (m, c) => {
                equal(m.text, 'hi');
                const usedPayload = await c.say('hi there bot');
                equal(usedPayload.body.text, 'hi there bot');
            });
            await bot.ingest(payload);
        });
        it('By using the Callback variant', async () => {
            const bot = new Bot({ token: TOKEN, ignoreSelf: false });
            const payload = { event: 'message.create.contact.chat', data: { conversation: { id: 123456, organization: 12345 }, message: { conversation: 123456, user: USER, text: 'hi' } } };
            request.resetHistory();
            request.resolvesArg(0);
            bot.on('message', (m, c) => {
                equal(m.text, 'hi');
                c.say('hi there bot', (err, data) => {
                    equal(err, null);
                    equal(data.body.text, 'hi there bot');
                });
            });
            await bot.ingest(payload);
        });
    });
    describe('Using ask on the context', () => {
        it('By using the Callback variant', (done) => {
            const bot = new Bot({ token: TOKEN, ignoreSelf: false });
            const payload = { event: 'message.create.contact.chat', data: { conversation: { id: 123456, organization: 12345, meta: {} }, message: { type: 'chat', id: 1, conversation: 123456, user: USER, text: 'hi', role: 'contact' } } };
            payload.data.conversation.meta[`_asked${USER}`] = true;
            const payload2 = { event: 'message.create.contact.chat', data: { conversation: { id: 123456, organization: 12345, meta: {} }, message: { type: 'chat', id: 2, conversation: 123456, user: USER, text: 'Mischa', role: 'contact' } } };
            payload2.data.conversation.meta[`_asked${USER}`] = true;
            request.resetHistory();
            request.resolvesArg(0);
            let answer;
            let asked;
            let nrmessages = 0;
            bot.on('message.create.contact.chat', (m, c) => {
                nrmessages++;
                asked = c.ask('what is your name', (ans) => {
                    answer = ans;
                });
            });
            bot.ingest(payload);
            setTimeout(() => { // give time to process payload
                bot.ingest(payload2);
                setTimeout(() => { // give time to process payload2
                    equal(answer.text, 'Mischa');
                    equal(asked, null, 'Should not return a Promise');
                    equal(nrmessages, 1, 'Should not trigger message.create.contact.chat for the answer');
                    done();
                }, 10);
            }, 10);
        });
        it('By using the Promise variant', (done) => {
            const bot = new Bot({ token: TOKEN, ignoreSelf: false });
            const payload = { event: 'message.create.contact.chat', data: { conversation: { id: 123456, organization: 12345, meta: {} }, message: { type: 'chat', id: 1, conversation: 123456, user: USER, text: 'hi', role: 'contact' } } };
            const payload2 = { event: 'message.create.contact.chat', data: { conversation: { id: 123456, organization: 12345, meta: {} }, message: { type: 'chat', id: 2, conversation: 123456, user: USER, text: 'Mischa', role: 'contact' } } };
            payload2.data.conversation.meta[`_asked${USER}`] = true;
            request.resetHistory();
            request.resolvesArg(0);
            let m2;
            let c2;
            bot.on('message.create.contact.chat', async (m, c) => {
                try {
                    [m2, c2] = await c.ask('what is your name');
                } catch (e) {
                    equal(true, false, 'should not raise error');
                }
            });
            bot.ingest(payload);
            setTimeout(() => { // give time to process payload
                bot.ingest(payload2);
                setTimeout(() => { // give time to process payload2
                    equal(c2.organization, 12345);
                    equal(m2.text, 'Mischa');
                    done();
                }, 10);
            }, 10);
        });
    });
});
