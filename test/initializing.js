/* eslint node/no-unsupported-features/es-syntax:0 */
const mware = require('mware').default;
const mock = require('mock-require');
const sinon = require('sinon');
const assert = require('assert');
const path = require('path');
const Bot = require('../lib/chipchat');

const SDKADMINID = '5ee7372448d9940011151f42';
const SDKADMINEMAIL = 'mischa+sdkadmin@chatshipper.com';
const TOKEN = process.env.TOKEN;
const REFRESHTOKEN = process.env.REFRESHTOKEN;
if (!TOKEN || !REFRESHTOKEN) {
    throw new Error('WARNING: please add test token env var TOKEN and REFRESHTOKEN');
}
const DEFAULTAPIOPTIONS = { token: TOKEN, refreshToken: REFRESHTOKEN, email: SDKADMINEMAIL };
const SDKTESTORG = '5ee7317effa8ca00117c990e';
require('dotenv').config({
    path: `${process.cwd()}${path.sep}.env`
});

const HOST = process.env.APIHOST || 'https://api.chatshipper.com';

const equal = assert.deepStrictEqual;

sinon.restore();
mock.stopAll();

describe('Create a new bot', () => {
    it('should be a Bot', () => {
        const bot = new Bot();
        equal(bot instanceof Bot, true, 'not a bot');
    });

    it('should have a valid authentication object after initilizing with a correct token', () => {
        const bot = new Bot({ token: TOKEN });
        assert.deepStrictEqual(bot.auth, {
            exp: 1592299229,
            iat: 1592212829,
            organization: SDKTESTORG,
            user: SDKADMINID
        });
    });
    it('should not have an authentication object after initilizing without token', () => {
        const bot = new Bot();
        equal(bot.auth, undefined);
    });
    it('should not have an authentication object after initilizing with incorrect token', () => {
        const bot = new Bot({ token: 'invalid' });
        equal(bot.auth, undefined);
    });
    it('should not have an authentication object after initilizing with incorrect refresh token', () => {
        const bot = new Bot({ token: 'token' });
        bot.on('error', (error) => {
            console.log(error);
        });
        equal(bot.auth, undefined);
    });
    it('Should have secret set to false by default', () => {
        const bot = new Bot();
        equal(bot.secret, process.env.SECRET || null);
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
        equal(bot.webhook, process.env.WEBHOOK_PATH || '/');
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
    // mischa here
    xit('Can activate send middleware', (done) => {
        const message = 'test';
        const middleware = (bot, mess) => {
            equal(mess);
            done();
        };
        const bot = new Bot(Object.assign({}, DEFAULTAPIOPTIONS,
            { middleware: { send: { middleware } } }));
        bot.send('5eea21c7300bd70011a15154', message);
    });
});
