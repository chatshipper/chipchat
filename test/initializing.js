const sinon = require('sinon');
const expect = require('chai').expect;
const Bot = require('../lib/chipchat');

describe('Create a new bot', () => {
    let bot;
    let server;
    let options;
    beforeEach(() => {
        options = {
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1YjExMGRhZWU3MGJhYTQ4NWIxYjE2YmEiLCJvcmdhbml6YXRpb24iOiI1OTc4YmY0YjAyOTY0MDRlNmY5OTQ3ZTUiLCJzY29wZSI6InZpZXdlciBndWVzdCBhZ2VudCBib3QgYWRtaW4iLCJpYXQiOjE1NjQ1NjkzMDMsImV4cCI6MTU2NDY1NTcwM30.2q6isPDL5uMwtnyThVGN8Hq9UMqhzAkf72mZdVrSFgc'
        };
        server = sinon.fakeServer.create();
        server.autoRespond = true;
    });

    afterEach(() => {
        server.restore();
    });

    it('should be a Bot', () => {
        bot = new Bot();
        expect(bot instanceof Bot).to.equal(true);
    });

    it('should have a valid authentication object after initilizing with a correct token', () => {
        bot = new Bot(options);
        expect(bot.auth).to.deep.equal({
            exp: 1564655703,
            iat: 1564569303,
            organization: '5978bf4b0296404e6f9947e5',
            user: '5b110daee70baa485b1b16ba'
        });
    });
    it('should not have an authentication object after initilizing without token', () => {
        bot = new Bot();
        expect(bot.auth).to.equal(undefined);
    });
    it('should not have an authentication object after initilizing with incorrect token', () => {
        bot = new Bot({ token: 'invalid' });
        expect(bot.auth).to.equal(undefined);
    });
});