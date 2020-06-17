/* eslint no-plusplus:0 */
const assert = require('assert');
const mock = require('mock-require');
//const sinon = require('sinon');
const path = require('path');
require('dotenv').config({
    path: `${process.cwd()}${path.sep}.env`
});

const SDKADMINID = '5ee7372448d9940011151f42';
const SDKADMINEMAIL = 'mischa+sdkadmin@chatshipper.com';
const SDKAGENTID = '5ee731deb306f000111815db';
const INVALIDTOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjQzMGVmNDEwYjdjYjBjYzI1ODAxODMiLCJvcmdhbml6YXRpb24iOiI1NjNmODA5ODM5NmM1MGRmNzc4NTdiNmQiLCJzY29wZSI6InZpZXdlciBndWVzdCBhZ2VudCBib3QgYWRtaW4iLCJncmFudF90eXBlIjoiYWNjZXNzX3Rva2VuIiwiaWF0IjoxNTkxODYwMzQzLCJleHAiOjE1OTE5NDY3NDN9.mdmn1Rg1rUxz5Hbe11mKsYzgHHVD2tqNeygJ1Qgsf-w';
const SDKTESTORG = '5ee7317effa8ca00117c990e';
//multi file reset
//sinon.restore();
mock.stopAll();
const testId = Math.round(new Date().getTime() / 1000);

// no real world requests, we replace request-promise that chipchat uses for a stub
//const request = sinon.stub();
//mock('request-promise', request);

const Api = require('../lib/chipchat');

const TOKEN = process.env.TOKEN;
const REFRESHTOKEN = process.env.REFRESHTOKEN;
if (!TOKEN || !REFRESHTOKEN) {
    throw new Error('WARNING: please add test token env var TOKEN and REFRESHTOKEN');
}

const DEFAULTAPIOPTIONS = { token: TOKEN, refreshToken: REFRESHTOKEN, email: SDKADMINEMAIL };
const METHODS = ['create', 'delete', 'get', 'list', 'update'];
const RESOURCES = [
    'users', 'channels', //'usergroups',
    'contacts', 'conversations', 'messages',
    'organizations', 'orggroups', 'services', 'forms',
    'workflows', 'metrics',
    'kbases', 'kbitems', 'articles', 'files', 'locations'
];
const equal = assert.deepStrictEqual;
//use it.only to run one test
//use describe.skip or xit to skip tests

describe('Client tests', () => {
    describe('The API should have all the resources', () => {
        RESOURCES.forEach((resource) => {
            it(`${resource} has all its methods`, () => {
                const api = new Api();
                equal(Object.keys(api[resource]).sort(), METHODS);
            });
        });
    });
    describe('Requesting Authentication', () => {
        it('The API should have a valid token', (done) => {
            const api = new Api(DEFAULTAPIOPTIONS);
            api.users.get(api.auth.user).then((user) => {
                equal(user.id, SDKADMINID, 'should be the sdk admin user');
            }).then(done).catch((e) => {
                equal(true, false, 'should not trigger error', e);
            });
        }).timeout(5000);
        it('The API should refresh to a valid token', (done) => {
            const api = new Api({
                token: INVALIDTOKEN,
                refreshToken: REFRESHTOKEN,
                email: SDKADMINEMAIL
            });
            api.users.get(SDKADMINID).then((user) => {
                equal(user.id, SDKADMINID, 'should be the sdk admin user');
            }).then(done).catch((e) => {
                equal(true, false, 'should not trigger error', e);
            });
        }).timeout(5000);
        it('The API should throw when refresh token is also invalid', (done) => {
            const api = new Api({
                token: INVALIDTOKEN,
                refreshToken: 'also invalid',
                email: SDKADMINEMAIL
            });
            api.users.get(SDKADMINID).then(() => {
                equal(true, false, 'should not be valid');
            }).catch((e) => {
                equal(e.statusCode, 401, 'should trigger a 401 error');
                done();
            });
        }).timeout(5000);
    });
    describe('Requesting recource endpoints', () => {
        it('A bot\'s resource should return a promise, when no callback is provided', (done) => {
            const bot = new Api(DEFAULTAPIOPTIONS);
            const call = bot.users.get(SDKAGENTID).then((user) => {
                equal(user.id, SDKAGENTID);
            }).then(done).catch((e) => {
                equal(true, false, 'should not trigger error', e);
            });
            equal(call instanceof Promise, true, 'without callback should return a promise');
        }).timeout(5000);
        it('A bot\'s resource should not return a promise when a callback is passed', (done) => {
            const bot = new Api(DEFAULTAPIOPTIONS);
            const call = bot.users.get(SDKAGENTID, (err, user) => {
                equal(err, null, 'callback should not have error');
                equal(user.id, SDKAGENTID, 'callback should be the agent user');
                done();
            });
            equal(call instanceof Promise, false, 'with callback should not return a promise');
        }).timeout(5000);
    });
    describe('Creating a conversation', () => {
        it('creating a conversation and deleting it again (with promise)', (done) => {
            const api = new Api(DEFAULTAPIOPTIONS);
            const payload = {
                name: `SDK test nr ${testId}a`,
                messages: [{ type: 'chat', text: 'hello world' }]
            };
            api.conversations.create(payload).then((conv) => {
                equal(conv.participants[0].user, SDKADMINID, 'should have participant admin user');
                equal(conv.name, `SDK test nr ${testId}a`, 'should have the correct name');
                equal(conv.organization, SDKTESTORG, 'should have the correct organization');
                return api.conversations.delete(conv.id);
            }).then(done).catch((e) => {
                equal(true, false, `should not have error ${e}`);
            });
        }).timeout(5000);
        it('creating a conversation and deleting it again (with callback)', (done) => {
            const api = new Api(DEFAULTAPIOPTIONS);
            const payload = {
                name: `SDK test nr ${testId}b`,
                messages: [{ type: 'chat', text: 'hello world' }]
            };
            const call = api.conversations.create(payload, (err, conv) => {
                equal(conv.participants[0].user, SDKADMINID, 'should have participant admin user');
                equal(conv.name, `SDK test nr ${testId}b`, 'should have the correct name');
                equal(conv.organization, SDKTESTORG, 'should have the correct organization');
                api.conversations.delete(conv.id);
                done();
            });
            equal(call instanceof Promise, false, 'with callback should not return a promise');
        }).timeout(5000);
        it('You can send a text direcly to a conversation with a promise', (done) => {
            const api = new Api(DEFAULTAPIOPTIONS);
            const payload = {
                name: `SDK test nr ${testId}c`,
                messages: [{ type: 'chat', text: 'first message' }]
            };
            api.conversations.create(payload).then((conv) => {
                const promise = api.send(conv.id, 'second message');

                equal(promise instanceof Promise, true, 'without callback should return a promise');
                promise.then((message) => {
                    equal(message.text, 'second message');
                }).then(() => api.conversations.delete(conv.id))
                    .then(done).catch((e) => {
                        equal(true, false, `should not have error ${e}`);
                    });
            });
        }).timeout(5000);
        it('You can send a text direcly to a conversation with a callback', (done) => {
            const api = new Api(DEFAULTAPIOPTIONS);
            const payload = {
                name: `SDK test nr ${testId}c`,
                messages: [{ type: 'chat', text: 'first message' }]
            };
            api.conversations.create(payload).then((conv) => {
                const promise = api.send(conv.id, 'second message', (err, message) => {
                    equal(message.text, 'second message');
                    api.conversations.delete(conv.id).then(done).catch((e) => {
                        equal(true, false, `should not have error ${e}`);
                    });
                });
                equal(promise instanceof Promise, false, 'with callback should not return a promise');
            });
        }).timeout(5000);
    });
    describe.only('Using say on the context to add a message to a conversation', () => {
        // for mocha to play nice with our .on events which are async
        // we need to return a promise and resolve/reject it accordingly
        // otherwise the tests will not fail properly
        it('By using the Promise variant', () => {
            return new Promise(async (resolve, reject) => {
                const api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                    ignoreSelf: false
                }));
                const payload = {
                    name: `SDK test nr ${testId}c`,
                    messages: [{ type: 'chat', text: 'first message' }]
                };
                const conv = await api.conversations.create(payload);
                const event = { event: 'message.create.contact.chat',
                    data: {
                        conversation: {
                            id: conv.id,
                            organization: conv.organization
                        },
                        message: {
                            conversation: conv.id,
                            user: SDKAGENTID,
                            text: 'hello world'
                        }
                    }
                };
                api.on('message', async (m, c) => {
                    equal(m.text, 'hello world');
                    const usedPayload = await c.say('hi there bot');
                    try {
                        equal(usedPayload.text, 'hi there bot');
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                    await api.conversations.delete(conv.id);
                });
                api.ingest(event);
            });
        });
        it('By using the Callback variant', () => {
            return new Promise(async (resolve, reject) => {
                const api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                    ignoreSelf: false
                }));
                const payload = {
                    name: `SDK test nr ${testId}c`,
                    messages: [{ type: 'chat', text: 'first message' }]
                };
                const conv = await api.conversations.create(payload);
                const event = { event: 'message.create.contact.chat',
                    data: {
                        conversation: {
                            id: conv.id,
                            organization: conv.organization
                        },
                        message: {
                            conversation: conv.id,
                            user: SDKAGENTID,
                            text: 'hello world'
                        }
                    }
                };
                api.on('message', async (m, c) => {
                    equal(m.text, 'hello world');
                    const call = await c.say('hi there bot', async (err, usedPayload) => {
                        try {
                            equal(usedPayload.text, 'hi there bot');
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                        await api.conversations.delete(conv.id);
                    });
                    equal(call instanceof Promise, false, 'with callback should not return a promise');
                });
                api.ingest(event);
            });
        }).timeout(5000);
    });
});
