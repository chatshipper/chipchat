/* eslint no-plusplus:0 */
const assert = require('assert');
const mock = require('mock-require');
const path = require('path');
require('dotenv').config({
    path: `${process.cwd()}${path.sep}.env`
});
const got = require('got');

const SDKADMINID = '5ee7372448d9940011151f42';
const SDKADMINEMAIL = 'mischa+sdkadmin@chatshipper.com';
const SDKAGENTID = '5ee731deb306f000111815db';
const INVALIDTOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjQzMGVmNDEwYjdjYjBjYzI1ODAxODMiLCJvcmdhbml6YXRpb24iOiI1NjNmODA5ODM5NmM1MGRmNzc4NTdiNmQiLCJzY29wZSI6InZpZXdlciBndWVzdCBhZ2VudCBib3QgYWRtaW4iLCJncmFudF90eXBlIjoiYWNjZXNzX3Rva2VuIiwiaWF0IjoxNTkxODYwMzQzLCJleHAiOjE1OTE5NDY3NDN9.mdmn1Rg1rUxz5Hbe11mKsYzgHHVD2tqNeygJ1Qgsf-w';
const SDKTESTORG = '5ee7317effa8ca00117c990e';
mock.stopAll();
const testId = Math.round(new Date().getTime() / 1000);

let api;
let bot;
const patchedGot = got.extend({
    hooks: {
        afterResponse: [
            (response) => {
                // we are emitting all requests so the tests can respond at exactly the right moment
                // this is needed because many actions in the sdk happen in the background
                [api, bot].forEach((o) => {
                    if (o) o.emit(`test.request.${response.request.options.method}`, response.request.options, response.body.text);
                });
                return response;
            }
        ]
    },
    mutableDefaults: true
});
mock('got', patchedGot);

const Api = require('../lib/chipchat'); //eslint-disable-line

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
                api = new Api();
                equal(Object.keys(api[resource]).sort(), METHODS);
            });
        });
    });
    describe('Requesting Authentication', () => {
        it('The API should have a valid token', (done) => {
            api = new Api(DEFAULTAPIOPTIONS);
            api.users.get(api.auth.user).then((user) => {
                equal(user.id, SDKADMINID, 'should be the sdk admin user');
            }).then(done).catch((e) => {
                equal(true, false, 'should not trigger error', e);
            });
        });
        it('The API should refresh to a valid token', (done) => {
            api = new Api({
                token: INVALIDTOKEN,
                refreshToken: REFRESHTOKEN,
                email: SDKADMINEMAIL
            });
            api.users.get(SDKADMINID).then((user) => {
                equal(user.id, SDKADMINID, 'should be the sdk admin user');
            }).then(done).catch((e) => {
                equal(true, false, 'should not trigger error', e);
            });
        });
        it('The API should throw when refresh token is also invalid', (done) => {
            api = new Api({
                token: INVALIDTOKEN,
                refreshToken: 'also invalid',
                email: SDKADMINEMAIL
            });
            api.users.get(SDKADMINID).then(() => {
                equal(true, false, 'should not get here without tokens');
            }).catch((e) => {
                equal(e.statusCode, 401, 'should trigger a 401 error');
                done();
            });
        });
    });
    describe('Requesting recource endpoints', () => {
        it('A bot\'s resource should return a promise, when no callback is provided', (done) => {
            bot = new Api(DEFAULTAPIOPTIONS);
            const call = bot.users.get(SDKAGENTID).then((user) => {
                equal(user.id, SDKAGENTID);
            }).then(done).catch((e) => {
                equal(true, false, 'should not trigger error', e);
            });
            equal(call instanceof Promise, true, 'without callback should return a promise');
        });
        it('A bot\'s resource should not return a promise when a callback is passed', (done) => {
            bot = new Api(DEFAULTAPIOPTIONS);
            const call = bot.users.get(SDKAGENTID, (err, user) => {
                equal(err, null, 'callback should not have error');
                equal(user.id, SDKAGENTID, 'callback should be the agent user');
                done();
            });
            equal(call instanceof Promise, false, 'with callback should not return a promise');
        });
    });
    describe('Creating a conversation', () => {
        it('creating a conversation and deleting it again (with promise)', (done) => {
            api = new Api(DEFAULTAPIOPTIONS);
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
        });
        it('creating a conversation and deleting it again (with callback)', (done) => {
            api = new Api(DEFAULTAPIOPTIONS);
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
        });
        it('You can send a text direcly to a conversation with a promise', (done) => {
            api = new Api(DEFAULTAPIOPTIONS);
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
        });
        it('You can send a text direcly to a conversation with a callback', (done) => {
            api = new Api(DEFAULTAPIOPTIONS);
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
        });//.timeout(5000);
    });
    describe('Using say on the context to add a message to a conversation', () => {
        // for mocha to play nice with our .on events which are async
        // we need to return a promise and resolve/reject it accordingly
        // otherwise the tests will not fail properly
        it('By using the Promise variant', () => {
            return new Promise(async (resolve, reject) => {
                api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
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
                api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
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
        });
    });
    describe('Using ask on the context in a conversation', () => {
        // for mocha to play nice with our .on events which are async
        // we need to return a promise and resolve/reject it accordingly
        // otherwise the tests will not fail properly
        it('By using the Promise variant', () => {
            return new Promise(async (resolve, reject) => {
                api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                    ignoreSelf: false
                }));
                const payload = {
                    name: `SDK test nr ${testId}c`,
                    messages: [{ type: 'chat', text: 'first message' }]
                };
                const conv = await api.conversations.create(payload);
                const context = await api.conversation(conv.id);
                const event = { event: 'message.create.contact.chat',
                    data: {
                        conversation: {
                            id: conv.id,
                            organization: conv.organization,
                            meta: {}
                        },
                        message: {
                            conversation: conv.id,
                            type: 'chat',
                            role: 'contact',
                            text: 'mischa'
                        }
                    }
                };
                // answer the context.ask below after /set _asked is finished
                api.on('test.request.POST', async (request, json) => {
                    if (request.method === 'POST' && json.includes(`/set _asked${api.auth.user}`)) {
                        const newContext = await api.conversation(conv.id);
                        event.data.conversation.meta[`_asked${api.auth.user}`] = newContext.meta[`_asked${api.auth.user}`].toString();
                        setTimeout(api.ingest.bind(api, event), 0); //next tick
                    }
                });
                const call = context.ask('what is your name?');
                equal(call instanceof Promise, true, 'Should return a promise');
                call.then((m) => {
                    equal(m.text, 'mischa');
                    resolve();
                }).catch((e) => {
                    equal(true, false, `should not have error ${e}`);
                    reject(e);
                }).finally(api.conversations.delete.bind(this, conv.id));
            });
        });
        it('By using the Callback variant', () => {
            return new Promise(async (resolve) => {
                api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                    ignoreSelf: false
                }));
                const payload = {
                    name: `SDK test nr ${testId}c`,
                    messages: [{ type: 'chat', text: 'first message' }]
                };
                const conv = await api.conversations.create(payload);
                const context = await api.conversation(conv.id);
                const event = { event: 'message.create.contact.chat',
                    data: {
                        conversation: {
                            id: conv.id,
                            organization: conv.organization,
                            meta: {}
                        },
                        message: {
                            conversation: conv.id,
                            type: 'chat',
                            role: 'contact',
                            text: 'mischa'
                        }
                    }
                };
                // answer the context.ask below after /set _asked is finished
                api.on('test.request.POST', async (request, json) => {
                    if (request.method === 'POST' && json.includes(`/set _asked${api.auth.user}`)) {
                        const newContext = await api.conversation(conv.id);
                        event.data.conversation.meta[`_asked${api.auth.user}`] = newContext.meta[`_asked${api.auth.user}`].toString();
                        setTimeout(api.ingest.bind(api, event), 0); //next tick
                    }
                });
                const call = context.ask('what is your name?', (m, c) => {
                    equal(c.id, conv.id, 'Should have the correct conv id');
                    equal(m.text, 'mischa');
                    api.conversations.delete(conv.id);
                    resolve();
                });
                equal(call instanceof Promise, false, 'Should not return a promise');
            });
        });
    });
});
