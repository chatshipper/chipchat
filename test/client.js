/* eslint no-plusplus:0 */
const assert = require('assert');
const mock = require('mock-require');
const path = require('path');

const file = `${process.cwd()}${path.sep}.env`;
require('dotenv').config({
    path: file
});
const got = require('got');

const TOKEN = process.env.CS_TOKEN;
const REFRESHTOKEN = process.env.CS_REFRESHTOKEN;
if (!TOKEN || !REFRESHTOKEN) {
    throw new Error('WARNING: please add test token env var TOKEN and REFRESHTOKEN');
}

const SDKADMINID = process.env.CS_ADMIN || '5ee7372448d9940011151f42';
const SDKADMINEMAIL = process.env.CS_ADMIN_EMAIL || 'mischa+sdkadmin@chatshipper.com';
const SDKAGENTID = process.env.CS_USER || '5ee731deb306f000111815db';
const INVALIDTOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjQzMGVmNDEwYjdjYjBjYzI1ODAxODMiLCJvcmdhbml6YXRpb24iOiI1NjNmODA5ODM5NmM1MGRmNzc4NTdiNmQiLCJzY29wZSI6InZpZXdlciBndWVzdCBhZ2VudCBib3QgYWRtaW4iLCJncmFudF90eXBlIjoiYWNjZXNzX3Rva2VuIiwiaWF0IjoxNTkxODYwMzQzLCJleHAiOjE1OTE5NDY3NDN9.mdmn1Rg1rUxz5Hbe11mKsYzgHHVD2tqNeygJ1Qgsf-w';
const SDKTESTORG = process.env.CS_ORGANIZATION || '5ee7317effa8ca00117c990e';

mock.stopAll();
const testId = Math.round(new Date().getTime() / 1000);
const testMessagesPagination = [
    { type: 'chat', text: 'hello 1' }, { type: 'chat', text: 'hello 2' }, { type: 'chat', text: 'hello 3' }, { type: 'chat', text: 'hello 4' },
    { type: 'chat', text: 'hello 5' }, { type: 'chat', text: 'hello 6' }, { type: 'chat', text: 'hello 7' }, { type: 'chat', text: 'hello 8' },
    { type: 'chat', text: 'hello 9' }, { type: 'chat', text: 'hello 10' }, { type: 'chat', text: 'hello 11' }, { type: 'chat', text: 'hello 12' },
    { type: 'chat', text: 'hello 13' }, { type: 'chat', text: 'hello 14' }, { type: 'chat', text: 'hello 15' }, { type: 'chat', text: 'hello 16' },
    { type: 'chat', text: 'hello 17' }, { type: 'chat', text: 'hello 18' }, { type: 'chat', text: 'hello 19' }, { type: 'chat', text: 'hello 20' },
    { type: 'chat', text: 'hello 21' }, { type: 'chat', text: 'hello 22' }, { type: 'chat', text: 'hello 23' }, { type: 'chat', text: 'hello 24' },
    { type: 'chat', text: 'hello 25' }, { type: 'chat', text: 'hello 26' }, { type: 'chat', text: 'hello 27' }, { type: 'chat', text: 'hello 28' },
    { type: 'chat', text: 'hello 29' }, { type: 'chat', text: 'hello 30' }
];

const callLater = (func, after = 1000) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => { func().then(resolve).catch(reject); }, after);
    });
};

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
        api = new Api();
        RESOURCES.forEach((resource) => {
            it(`${resource} has all its methods`, () => {
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
            }).then(done);/*.catch((e) => {
                equal(true, false, 'should not trigger error', e);
            });*/
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
            api = new Api(DEFAULTAPIOPTIONS);
            const call = api.users.get(SDKAGENTID).then((user) => {
                equal(user.id, SDKAGENTID);
            }).then(done).catch((e) => {
                equal(true, false, 'should not trigger error', e);
            });
            equal(call instanceof Promise, true, 'without callback should return a promise');
        });
        it('A bot\'s resource should not return a promise when a callback is passed', (done) => {
            api = new Api(DEFAULTAPIOPTIONS);
            const call = api.users.get(SDKAGENTID, (err, user) => {
                equal(err, null, 'callback should not have error');
                equal(user.id, SDKAGENTID, 'callback should be the agent user');
                done();
            });
            equal(call instanceof Promise, false, 'with callback should not return a promise');
        });
    });
    describe('Requesting recource endpoint', () => {
        it('With query string in json', (done) => {
            api = new Api(DEFAULTAPIOPTIONS);
            const call = api.users.list({ id: SDKAGENTID }).then((users) => {
                equal(users[0].id, SDKAGENTID);
            }).then(done).catch((e) => {
                equal(true, false, 'should not trigger error', e);
            });
            equal(call instanceof Promise, true, 'without callback should return a promise');
        });
        it('Will return error if callback is not a function', (done) => {
            const middleware = (b, mess) => {
                equal(mess, { conversation: 'fakeconv', text: 'hello' }, 'middleware ok');
            };
            api = new Api(Object.assign({ ignoreBots: false, ignoreSelf: false },
                DEFAULTAPIOPTIONS,
                { middleware: { send: middleware } }));
            let call;
            try {
                call = api.send('fakeconv', 'hello', 'wrongcallback');
            } catch (e) {
                equal(e instanceof Error, true, 'is an error');
                equal(e.message, 'options is not an object', 'should report options is not an object');
                done();
            }
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
            api.conversations.create(payload).then((c) => {
                return callLater(() => {
                    return api.conversations.get(c.id).then(conv => {
                        equal(conv.participants[0].user, SDKADMINID, 'should have participant admin user');
                        equal(conv.name, `SDK test nr ${testId}a`, 'should have the correct name');
                        equal(conv.organization, SDKTESTORG, 'should have the correct organization');
                        return callLater(api.conversations.delete.bind(this, conv.id));
                    });
                });
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
            const call = api.conversations.create(payload, (err, c) => {
                setTimeout(() => {
                    api.conversations.get(c.id, (err2, conv) => {
                        equal(conv.participants[0].user, SDKADMINID, 'should have participant admin user');
                        equal(conv.name, `SDK test nr ${testId}b`, 'should have the correct name');
                        equal(conv.organization, SDKTESTORG, 'should have the correct organization');
                        callLater(api.conversations.delete.bind(this, conv.id));
                        done();
                    });
                }, 1000);
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
                }).then(done);
                callLater(api.conversations.delete.bind(this, conv.id));
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
                    done();
                    callLater(api.conversations.delete.bind(this, conv.id));
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
            return new Promise((resolve, reject) => {
                api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                    ignoreSelf: false
                }));
                const payload = {
                    name: `SDK test nr ${testId}c`,
                    messages: [{ type: 'chat', text: 'first message' }]
                };
                api.conversations.create(payload).then((conv) => {
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
                        callLater(api.conversations.delete.bind(this, conv.id));
                    });
                    api.ingest(event);
                });
            });
        });
        it('By using the Callback variant', () => {
            return new Promise((resolve, reject) => {
                api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                    ignoreSelf: false
                }));
                const payload = {
                    name: `SDK test nr ${testId}c`,
                    messages: [{ type: 'chat', text: 'first message' }]
                };
                api.conversations.create(payload).then((conv) => {
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
                            callLater(api.conversations.delete.bind(this, conv.id));
                        });
                        equal(call instanceof Promise, false, 'with callback should not return a promise');
                    });
                    api.ingest(event);
                });
            });
        });
    });
    describe('Using ask on the context in a conversation', () => {
        // for mocha to play nice with our .on events which are async
        // we need to return a promise and resolve/reject it accordingly
        // otherwise the tests will not fail properly
        it('By using the Promise variant', () => {
            return new Promise((resolve, reject) => {
                api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                    ignoreSelf: false
                }));
                const payload = {
                    name: `SDK test nr ${testId}c`,
                    messages: [{ type: 'chat', text: 'first message' }]
                };
                api.conversations.create(payload).then((conv) => {
                    api.conversation(conv.id).then((context) => {
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
                        }).finally(callLater(api.conversations.delete.bind(this, conv.id)));
                    });
                });
            });
        });
        it('By using the Callback variant', () => {
            return new Promise((resolve) => {
                api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                    ignoreSelf: false
                }));
                const payload = {
                    name: `SDK test nr ${testId}c`,
                    messages: [{ type: 'chat', text: 'first message' }]
                };
                api.conversations.create(payload).then((conv) => {
                    api.conversation(conv.id).then((context) => {
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
                            callLater(api.conversations.delete.bind(this, conv.id));
                            resolve();
                        });
                        equal(call instanceof Promise, false, 'Should not return a promise');
                    });
                });
            });
        });
    });
    describe('Send middleware processing errors correctly', () => {
        it('it passes the error to the callback if callback is used', (done) => {
            api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                ignoreSelf: false
            }));
            let call;
            try {
                call = api.send('5ee731deb306f000111815db', 'hello', (err, mess) => {
                    equal(mess, null, 'should not have an answer');
                    equal(err.message, 'Conversation not found', 'should report correct error');
                    done();
                });
            } catch (e) {
                equal(true, false, 'Error is handled in callback');
            }
            equal(call instanceof Promise, false, 'with callback should not return a promise');
        });
        it('it passes the error to the reject if Promise is used', (done) => {
            api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                ignoreSelf: false
            }));
            let call;
            try {
                call = api.send('5ee731deb306f000111815db', 'hello').then(() => {
                    equal(true, false, 'Error is handled in catch');
                }).catch((err) => {
                    equal(err.message, 'Conversation not found', 'should report correct error');
                    done();
                });
            } catch (e) {
                equal(true, false, 'Error is handled in callback');
            }
            equal(call instanceof Promise, true, 'without callback should return a promise');
        });
    });
    describe('Using registerCallback', () => {
        it('named callback works', () => {
            return new Promise((resolve) => {
                api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                    ignoreSelf: false
                }));
                const payload = {
                    name: `SDK test nr ${testId}c`,
                    messages: [{ type: 'chat', text: 'hello' }]
                };
                api.conversations.create(payload).then((conv) => {
                    api.registerCallback('answerHello', (m, c) => {
                        equal(c.id, conv.id, 'Should have the correct conv id');
                        equal(m.text, 'mischa', 'Should have the correct message');
                        callLater(api.conversations.delete.bind(this, conv.id));
                        resolve();
                    });
                    api.conversation(conv.id).then((context) => {
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
                        const call = context.ask('what is your name?', 'answerHello');
                        equal(call instanceof Promise, false, 'Should not return a promise');
                    });
                });
            });
        });
    });
    describe('Using onText', () => {
        it('onText callback works', () => {
            return new Promise((resolve) => {
                api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                    ignoreSelf: false, ignoreBots: false
                }));
                const payload = {
                    name: `SDK test nr ${testId}c`,
                    messages: [{ type: 'chat', text: 'hello' }]
                };
                // answer the context.ask below after /set _asked is finished
                api.conversations.create(payload).then((conv) => {
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
                                text: 'hello'
                            }
                        }
                    };
                    api.onText('hello', (m, c) => {
                        equal(c.id, conv.id, 'Should have the correct conv id');
                        equal(m.text, 'hello', 'Should have the correct message');
                        callLater(api.conversations.delete.bind(this, conv.id));
                        api.removeTextListener('hello');
                        resolve();
                    });
                    setTimeout(api.ingest.bind(api, event), 0); //next tick
                });
            });
        });
    });
    describe('Using preloading of organization', () => {
        it('it does not preload the organization when not enabled', () => {
            return new Promise((resolve) => {
                api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                    ignoreSelf: false,
                    ignoreBots: false
                }));
                const name = `SDK test nr ${testId}c`;
                const payload = {
                    name,
                    messages: [{ type: 'chat', text: 'hello' }]
                };
                // we get a conversation the preload later
                api.conversations.create(payload).then((conv) => {
                    // we reset chipchat
                    api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                        ignoreSelf: false,
                        ignoreBots: false
                    }));
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
                                text: 'hello'
                            }
                        }
                    };
                    api.on('message', async (m, c) => {
                        equal(c.id, conv.id, 'Should have the correct conv id');
                        equal(c.organization, SDKTESTORG, 'Should have organization id');
                        equal(m.text, 'hello', 'Should have the correct message');
                        await callLater(api.conversations.delete.bind(this, conv.id));
                        resolve();
                    });
                    setTimeout(api.ingest.bind(api, event), 0); //next tick
                });
            });
        });
        it('it preloads the organization when enabled', () => {
            return new Promise((resolve) => {
                api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                    ignoreSelf: false,
                    ignoreBots: false
                }));
                const name = `SDK test nr ${testId}c`;
                const payload = {
                    name,
                    messages: [{ type: 'chat', text: 'hello' }]
                };
                // we get a conversation the preload later
                api.conversations.create(payload).then((conv) => {
                    // we reset chipchat
                    api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                        ignoreSelf: false,
                        ignoreBots: false,
                        preloadOrganizations: true
                    }));
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
                                text: 'hello'
                            }
                        }
                    };
                    let count = 0;
                    api.on('test.request.GET', async (request) => {
                        count += 1;
                        if (request.method === 'GET' && count === 1) {
                            api.on('message', async (m, c) => {
                                equal(c.id, conv.id, 'Should have the correct conv id');
                                equal(c.organization.status, 'active', 'Should have organization details');
                                equal(m.text, 'hello', 'Should have the correct message');
                                callLater(api.conversations.delete.bind(this, conv.id));
                                resolve();
                            });
                        }
                    });
                    setTimeout(api.ingest.bind(api, event), 0); //next tick
                });
            });
        });
    });
    describe('Using context set', () => {
        it('it sets meta correctly', () => {
            return new Promise((resolve) => {
                api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                    ignoreSelf: false,
                    ignoreBots: false
                }));
                const name = `SDK test nr ${testId}c`;
                const payload = {
                    name,
                    messages: [{ type: 'chat', text: 'hello' }]
                };
                // we get a conversation the preload later
                api.conversations.create(payload).then((conv) => {
                    const event = { event: 'message.create.contact.chat',
                        data: {
                            conversation: {
                                id: conv.id,
                                organization: conv.organization
                            },
                            message: {
                                conversation: conv.id,
                                type: 'chat',
                                role: 'contact',
                                text: 'hello'
                            }
                        }
                    };
                    api.conversation(conv.id).then((context) => {
                        api.on('test.request.POST', async () => {
                            api.on('message', async (m, c) => {
                                equal(c.id, conv.id, 'Should have the correct conv id');
                                equal(m.text, 'hello', 'Should have the correct message');
                                const newContext = await api.conversation(conv.id);
                                equal(newContext.meta.mischa, 'crazy', 'Should have the correct meta');
                                callLater(api.conversations.delete.bind(this, conv.id));
                                resolve();
                            });
                            setTimeout(api.ingest.bind(api, event), 0); //next tick
                        });
                        context.set('mischa', 'crazy');
                    });
                });
            });
        });
    });
    describe('Using Pagination', () => {
        it('Pagination should be off by default', () => {
            return new Promise((resolve) => {
                api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                    ignoreSelf: false,
                    ignoreBots: false
                }));
                const name = `SDK test nr ${testId} pagination 1`;
                const payload = {
                    name,
                    messages: testMessagesPagination
                };
                // we get a conversation the preload later
                let count = 0;
                api.conversations.create(payload).then((conv) => {
                    api.messages.list({ conversation: conv.id, text: '~hello' }).then((messages) => {
                        equal(messages.length, 30, 'should have 30 messages');
                        callLater(api.conversations.delete.bind(this, conv.id), 1500);
                        callLater(() => {
                            equal(count, 1, 'should have called GET 1 time');
                            return Promise.resolve();
                        }).then(resolve);
                    }).catch((e) => {
                        equal(true, false, `should not trigger error: ${e}`);
                    });
                });
                api.on('test.request.GET', async () => {
                    count += 1;
                });
            });
        });
        it('Pagination should paginate in 3 slices when setup in api options', () => {
            return new Promise((resolve) => {
                api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                    ignoreSelf: false,
                    ignoreBots: false,
                    pagination: {
                        limit: 10
                    }
                }));
                const name = `SDK test nr ${testId} pagination 1`;
                const payload = {
                    name,
                    messages: testMessagesPagination
                };
                // we get a conversation the preload later
                let count = 0;
                api.conversations.create(payload).then((conv) => {
                    api.messages.list({ conversation: conv.id, text: '~hello' }).then((messages) => {
                        equal(messages.length, 30, 'should have 30 messages');
                        callLater(api.conversations.delete.bind(this, conv.id), 1500);
                        callLater(() => {
                            equal(count, 3, 'should have called GET 3 times');
                            return Promise.resolve();
                        }).then(resolve);
                    }).catch((e) => {
                        equal(true, false, `should not trigger error: ${e}`);
                    });
                });
                api.on('test.request.GET', async () => {
                    count += 1;
                });
            });
        });
        it('Pagination should paginate in 3 slices when setup as list params', () => {
            return new Promise((resolve) => {
                api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                    ignoreSelf: false,
                    ignoreBots: false
                }));
                const name = `SDK test nr ${testId} pagination 1`;
                const payload = {
                    name,
                    messages: testMessagesPagination
                };
                // we get a conversation the preload later
                let count = 0;
                api.conversations.create(payload).then((conv) => {
                    api.messages.list({
                        conversation: conv.id,
                        text: '~hello',
                        pagination: {
                            limit: 10
                        }
                    }).then((messages) => {
                        equal(messages.length, 30, 'should have 30 messages');
                        callLater(api.conversations.delete.bind(this, conv.id), 1500);
                        callLater(() => {
                            equal(count, 3, 'should have called GET 3 times');
                            return Promise.resolve();
                        }).then(resolve);
                    }).catch((e) => {
                        equal(true, false, `should not trigger error: ${e}`);
                    });
                });
                api.on('test.request.GET', async () => {
                    count += 1;
                });
            });
        });
        it('Paginate complex request', () => {
            return new Promise((resolve, reject) => {
                api = new Api(Object.assign({}, DEFAULTAPIOPTIONS, {
                    pagination: {
                        limit: 10
                    }
                }));
                const payload = {
                    updatedAt: '>=2020-09-14',
                    orgPath: '^5978bf4b0296404e6f9947e5',
                    participants: { inbox: true },
                    select: 'id, updatedAt, participants',
                    pagination: { limit: 50 }
                };
                // we get a conversation the preload later
                api.conversations.list(payload).then((conversations) => {
                    equal(conversations.length, 0);
                }).then(resolve).catch(reject);
            });
        });
    });
});
