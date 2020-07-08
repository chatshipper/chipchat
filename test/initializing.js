/* eslint node/no-unsupported-features/es-syntax:0 */
const mware = require('mware').default;
const assert = require('assert');
const path = require('path');
const Bot = require('../lib/chipchat');

const TOKEN = process.env.CS_TOKEN;
const USER = process.env.CS_USER;
const ORGANIZATION = process.env.CS_ORGANIZATION;
const SECRET = process.env.CS_SECRET;
const WEBHOOK_PATH = process.env.CS_WEBHOOK_PATH || '/';

require('dotenv').config({
    path: `${process.cwd()}${path.sep}.env`
});

const HOST = process.env.CS_APIHOST || 'https://api.chatshipper.com';

assert.ok(TOKEN && USER && ORGANIZATION && HOST);

const equal = assert.deepStrictEqual;

describe('Create a new bot', () => {
    it('should be a Bot', () => {
        const bot = new Bot();
        equal(bot instanceof Bot, true, 'not a bot');
    });

    it('should have a valid authentication object after initilizing with a correct token', () => {
        const bot = new Bot({ token: TOKEN });
        equal(bot.auth.organization, ORGANIZATION, 'Bad organization token');
        equal(bot.auth.user, USER, 'Bad user token');
    });
    it('should not have an authentication object after initilizing without token', () => {
        const bot = new Bot();
        equal(bot.auth, undefined);
    });
    it('should not have an authentication object after initilizing with incorrect token', () => {
        const bot = new Bot({ token: 'invalid' });
        equal(bot.auth, undefined);
    });
    it('Should have secret set to false by default', () => {
        const bot = new Bot();
        equal(bot.secret, SECRET || null);
    });
    it('Should secret set to a secret when passed via options', () => {
        const bot = new Bot({ secret: 'secrettest' });
        equal(bot.secret, 'secrettest');
    });
7    it('Should secret set by setting the environment SECRET', () => {
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
});
