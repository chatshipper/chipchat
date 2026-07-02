/* eslint node/no-unsupported-features/es-syntax:0 */
const mware = require('mware').default;
const mock = require('mock-require');
const assert = require('assert');
const path = require('path');

mock.stopAll();

delete require.cache[require.resolve('../lib/chipchat')]; //load fresh chipchat
const Bot = require('../lib/chipchat');

const TOKEN = process.env.CS_TOKEN;
const REFRESHTOKEN = process.env.CS_REFRESHTOKEN;
const USER = process.env.CS_ADMIN || '5ee7372448d9940011151f42';
const ORGANIZATION = process.env.CS_ORGANIZATION || '5ee7317effa8ca00117c990e';
const SECRET = process.env.SECRET;
const WEBHOOK_PATH = process.env.CS_WEBHOOK_PATH || '/';
const HOST = process.env.CS_APIHOST || 'https://api.web1on1.chat';

if (!TOKEN || !REFRESHTOKEN) {
    throw new Error('WARNING: please add test token env var TOKEN and REFRESHTOKEN');
}
const DEFAULTAPIOPTIONS = { token: TOKEN, refreshToken: REFRESHTOKEN, preloadBots: false };

require('dotenv').config({
    path: `${process.cwd()}${path.sep}.env`
});

assert.ok(TOKEN && USER && ORGANIZATION && HOST);

const equal = assert.deepStrictEqual;

describe('Create a new bot', () => {
    it('should be a Bot', () => {
        const bot = new Bot();
        equal(bot instanceof Bot, true, 'not a bot');
    });

    it('should have a valid authentication object after initializing with a correct token', () => {
        const bot = new Bot({ token: TOKEN });
        equal(bot.auth.organization, ORGANIZATION, 'Bad organization token');
        equal(bot.auth.user, USER, 'Bad user token');
    });
    it('Should have secret set to false by default', () => {
        const bot = new Bot();
        equal(bot.secret, SECRET || null);
    });
    it('Should secret set to a secret when passed via options', () => {
        const bot = new Bot({ secret: 'secrettest' });
        equal(bot.secret, 'secrettest');
    });
    it('Should secret set by setting the environment SECRET', () => {
        const restore = { ...process.env };
        process.env.SECRET = 'secrettest';
        const bot = new Bot();
        equal(bot.secret, 'secrettest');
        process.env = { ...restore };
    });
    it('Should have a default host', () => {
        const bot = new Bot();
        equal(bot.host, HOST);
    });
    it('Should get a different host when passing a host in the options', () => {
        const bot = new Bot({ host: 'testhost' });
        equal(bot.host, 'testhost');
    });
    it('Should set the host by passing the environment APIHOST', () => {
        const restore = { ...process.env };
        process.env.APIHOST = 'testapihost';
        const bot = new Bot();
        equal(bot.host, 'testapihost');
        process.env = { ...restore };
    });
    it('Should have preloadOrganizations set to false by default', () => {
        const bot = new Bot();
        equal(bot.preloadOrganizations, false);
    });
    it('Should have preloadOrganizations set to true if passed to options', () => {
        const bot = new Bot({ preloadOrganizations: true });
        equal(bot.preloadOrganizations, true);
    });
    it('Should have onlyFirstMatch set to false by default', () => {
        const bot = new Bot();
        equal(bot.onlyFirstMatch, false);
    });
    it('Should have onlyFirstMatch set to true if passed to options', () => {
        const bot = new Bot({ onlyFirstMatch: true });
        equal(bot.onlyFirstMatch, true);
    });

    it('Should have send middleware active', () => {
        const bot = new Bot();
        equal(bot.middleware.send.toString(), mware().toString());
    });
    it('Should have receive middleware active', () => {
        const bot = new Bot();
        equal(bot.middleware.receive.toString(), mware().toString());
    });
    it('Should have ignoreBots set to true by default', () => {
        const bot = new Bot();
        equal(bot.ignoreBots, true);
    });
    it('Should have ignoreBots set to false when passed via option', () => {
        const bot = new Bot({ ignoreBots: false });
        equal(bot.ignoreBots, false);
    });
    it('Should have the webhook path set to / by default', () => {
        const bot = new Bot();
        equal(bot.webhook, WEBHOOK_PATH);
    });
    it('Should have the webhook path set by setting the webhook option', () => {
        const bot = new Bot({ webhook: '/hi' });
        equal(bot.webhook, '/hi');
    });
    it('Should have the webhook path set by setting the environment WEBHOOK_PATH', () => {
        const restore = { ...process.env };
        process.env.WEBHOOK_PATH = '/nice';
        const bot = new Bot();
        equal(bot.webhook, '/nice');
        process.env = { ...restore };
    });
    it('Should add a / to a path that does not start with a /', () => {
        const bot = new Bot({ webhook: 'hi/my/friend' });
        equal(bot.webhook, '/hi/my/friend');
    });
    it('Can activate send middleware', (done) => {
        const message = 'test';
        const middleware = (bot, mess) => {
            equal(mess, { conversation: 'fakeconv', text: message });
            done();
        };
        const bot = new Bot(Object.assign({ ignoreBots: false, ignoreSelf: false },
            DEFAULTAPIOPTIONS,
            { middleware: { send: middleware } }));
        // we can use fake conv id as we are canceling in the middleware
        bot.send('fakeconv', message, () => { });
    });
    it('Can activate receive middleware', (done) => {
        // we can use fake conv id as we are canceling in the middleware
        const event = { event: 'message.create.contact.chat',
            data: {
                conversation: {
                    id: 'fakeid',
                    organization: 'fakeorg',
                    meta: {}
                },
                message: {
                    conversation: 'fakeid',
                    type: 'chat',
                    role: 'contact',
                    text: 'mischa'
                }
            }
        };
        const middleware = (bot, mess) => {
            equal(mess, event);
            done();
        };
        const bot = new Bot(Object.assign({ ignoreBots: false, ignoreSelf: false },
            DEFAULTAPIOPTIONS,
            { middleware: { receive: middleware } }));
        bot.ingest(event);
    });
});

const jwt = require('jsonwebtoken');

describe('JWT handling in the constructor', () => {
    const claims = {
        _id: 'user-1', organization: 'org-1', scope: 'admin bot', grant_type: 'access_token'
    };
    const signingSecret = 'test-signing-secret';
    const signedToken = jwt.sign(claims, signingSecret);
    const noneToken = jwt.sign(claims, null, { algorithm: 'none' });

    it('rejects an alg:none forged token: claims must not populate this.auth', () => {
        const bot = new Bot({ token: noneToken });
        equal(bot.auth.user, undefined);
        equal(bot.auth.organization, undefined);
        equal(bot.auth.token, undefined);
    });

    it('accepts a well-formed token (no key) and populates this.auth from its claims', () => {
        const bot = new Bot({ token: signedToken });
        equal(bot.auth.user, 'user-1');
        equal(bot.auth.organization, 'org-1');
        equal(bot.auth.token, signedToken);
    });

    it('verifies the signature when a jwtKey is supplied and the key matches', () => {
        const bot = new Bot({ token: signedToken, jwtKey: signingSecret });
        equal(bot.auth.user, 'user-1');
        equal(bot.auth.organization, 'org-1');
    });

    it('throws when a jwtKey is supplied and the signature does not match', () => {
        assert.throws(
            () => new Bot({ token: signedToken, jwtKey: 'wrong-secret' }),
            /Invalid token/
        );
    });

    it('throws for an alg:none token even when a jwtKey is supplied', () => {
        assert.throws(
            () => new Bot({ token: noneToken, jwtKey: signingSecret }),
            /Invalid token/
        );
    });

    it('decodeJwt returns null for an alg:none token', () => {
        equal(Bot.decodeJwt(noneToken), null);
    });

    it('decodeJwt returns the payload for a token with an allowed algorithm', () => {
        equal(Bot.decodeJwt(signedToken).organization, 'org-1');
    });

    it('verifyJwt returns claims for a valid signature and throws for a bad one', () => {
        equal(Bot.verifyJwt(signedToken, signingSecret)._id, 'user-1');
        assert.throws(() => Bot.verifyJwt(signedToken, 'wrong-secret'));
    });
});

const { generateKeyPairSync } = require('crypto');

describe('JWKS / RS256 verification (constructor jwksUri)', () => {
    const kid = 'test-kid-1';
    const rsClaims = {
        _id: 'user-9', organization: 'org-9', scope: 'admin bot', grant_type: 'access_token'
    };
    const signer = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const attacker = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const publicPem = signer.publicKey.export({ type: 'spki', format: 'pem' });
    const rsToken = jwt.sign(rsClaims, signer.privateKey, { algorithm: 'RS256', keyid: kid });
    const forgedToken = jwt.sign(rsClaims, attacker.privateKey, { algorithm: 'RS256', keyid: kid });

    before(() => {
        mock('jwks-rsa', () => ({
            getSigningKey: async (requestedKid) => {
                if (requestedKid !== kid) throw new Error(`unknown kid ${requestedKid}`);
                return { getPublicKey: () => publicPem };
            }
        }));
    });
    after(() => mock.stop('jwks-rsa'));

    it('verifies an RS256 token via JWKS and populates this.auth from verified claims', async () => {
        const bot = new Bot({ token: rsToken, jwksUri: 'https://example.test/jwks.json' });
        await bot.ready;
        equal(bot.auth.user, 'user-9');
        equal(bot.auth.organization, 'org-9');
        equal(bot.auth.token, rsToken);
    });

    it('rejects a forged RS256 token: ready rejects, error emitted, no auth set', async () => {
        const bot = new Bot({ token: forgedToken, jwksUri: 'https://example.test/jwks.json' });
        let emitted = null;
        bot.on('error', (e) => { emitted = e; });
        await assert.rejects(bot.ready, /Invalid token/);
        equal(bot.auth.user, undefined);
        equal(emitted instanceof Error, true);
    });

    it('gives jwksUri precedence over jwtKey', async () => {
        const bot = new Bot({
            token: rsToken, jwksUri: 'https://example.test/jwks.json', jwtKey: 'unused-hs-secret'
        });
        await bot.ready;
        equal(bot.auth.user, 'user-9');
        equal(bot.auth.organization, 'org-9');
    });

    it('defers ingest until JWKS verification completes (auth.user available when processed)', async () => {
        const bot = new Bot({
            token: rsToken, jwksUri: 'https://example.test/jwks.json', ignoreBots: false, ignoreSelf: false
        });
        let seenUser;
        const event = {
            event: 'message.create.contact.chat',
            data: {
                conversation: { id: 'c1', organization: 'org-9', meta: {} },
                message: { conversation: 'c1', type: 'chat', role: 'contact', text: 'hi' }
            }
        };
        bot.middleware.receive.use((b, m, resolve) => { seenUser = b.auth.user; resolve(); });
        await bot.ingest(event, undefined, { async: true });
        equal(seenUser, 'user-9');
    });
});
