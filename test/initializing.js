const assert = require('assert');
const Bot = require('../lib/chipchat');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjExMGRhZWU3MGJhYTQ4NWIxYjE2YmEiLCJvcmdhbml6YXRpb24iOiI1OTc4YmY0YjAyOTY0MDRlNmY5OTQ3ZTUiLCJzY29wZSI6InZpZXdlciBndWVzdCBhZ2VudCBib3QgYWRtaW4iLCJpYXQiOjE1NjQ1NjkzMDMsImV4cCI6MTU2NDY1NTcwM30.2q6isPDL5uMwtnyThVGN8Hq9UMqhzAkf72mZdVrSFgc';
const USER = '5b110daee70baa485b1b16ba';
const ORGANISATION = '5978bf4b0296404e6f9947e5';

describe('Create a new bot', () => {
    it('should be a Bot', () => {
        const bot = new Bot();
        assert(bot instanceof Bot, true, 'not a bot');
    });

    it('should have a valid authentication object after initilizing with a correct token', () => {
        const bot = new Bot({ token: TOKEN });
        assert.deepStrictEqual(bot.auth, {
            exp: 1564655703,
            iat: 1564569303,
            organization: ORGANISATION,
            user: USER
        });
    });
    it('should not have an authentication object after initilizing without token', () => {
        const bot = new Bot();
        assert.strictEqual(bot.auth, undefined);
    });
    it('should not have an authentication object after initilizing with incorrect token', () => {
        const bot = new Bot({ token: 'invalid' });
        assert.strictEqual(bot.auth, undefined);
    });
});
