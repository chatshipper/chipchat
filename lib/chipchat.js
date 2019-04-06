/**
   ChipChat - ChatShipper SDK Main module
   @module sdk
   @author Chatshipper
*/

'use strict';

const debug         = require('debug')('chipchat:core');
const EventEmitter2 = require('eventemitter2');
const mware         = require('mware').default;
const jwt           = require('jsonwebtoken');
const RestAPI       = require('./client');
const Server        = require('./server');

/**
   SDK Main Class
*/
class ChipChat extends RestAPI(Server(EventEmitter2)) {
    /**
       @constructs ChatShipper
       @param {object} opts - Constructor Options
       @param {string} opts.token - Chatshipper API Token, REQUIRED
       @param {string} opts.secret - Chatshipper Application Secret, OPTIONAL required for
         webhooks
       @param {string} opts.verify_token - Verify if opts.token is valid, defaults to false
       @param {string} opts.host - Target Chatshipper API server, defaults to https://api.chatshipper.com
       @param {string} opts.webhook - Webhook path segment, defaults to '/'
       @param {string} opts.middleware - Middleware stack functions
       @param {function}|{array} opts.middleware.send - A function or a list of functions for send
         pipeline
       @param {function}|{array} opts.middleware.receive - A function or a list of functions for
         receive pipeline
     */
    constructor(options) {
        super();

        EventEmitter2.call(this, {
            wildcard: true,
            verbose: true
        });

        const opts = options || {};
        if (!opts.token) {
            throw new Error('Missing auth token');
        }
        this.token = opts.token;
        this.secret = opts.secret || process.env.SECRET || false;
        this.host = opts.host || process.env.APIHOST || 'https://api.chatshipper.com';

        const decoded = jwt.decode(opts.token, { complete: true });
        const { _id, organization, iat, exp } = decoded.payload;
        this.auth = { user: _id, organization, iat, exp };

        this.middleware = {
            receive: mware(),
            send: mware()
        };
        if (opts.middleware) {
            if (opts.middleware.send) {
                this.middleware.send.use(opts.middleware.send);
            }
            if (opts.middleware.receive) {
                this.middleware.receive.use(opts.middleware.receive);
            }
        }

        const webhookPath = options.webhook || process.env.WEBHOOK_PATH || '/';
        this.webhook = webhookPath.charAt(0) !== '/' ? `/${webhookPath}` : webhookPath;

        //this._hearMap = [];
        this._conversations = [];
        this.conversations = {};
    }

    /**
     * Modules are simple functions that you can use to organize your code in
     * different files and folders.
     * @param {Function} factory Called immediatly and receives the bot
     * instance as its only parameter.
     */
    module(factory) {
        return factory.apply(this, [this]);
    }

    use(middleware) {
        this.middleware.receive.use(middleware);
    }

    ingest(payload) {
        debug('ingest %s event', payload.event, Object.keys(payload).join(','));
        if (payload.event === 'conversation.message' || payload.event.startsWith('message')) {
            if (payload.data.conversation) {
                this.conversations[payload.data.conversation.id] = payload.data.conversation;
            }
            this._handleEvent(payload.event, payload);
            //this._handleMessage(payload.data.message);
        } else if (payload.event === 'channel.notify') {
            this._handleEvent('notify', payload.data.message);
        } else if (payload.activity) {
            this._handleEvent('activity', payload.event, payload.activity);
        } else {
            console.log('unknown event', Object.keys(payload.data)); // JSON.stringify(payload, null, 4));
        }
    }

    say(conversation, payload, cb) {
        return this.sendMessage(conversation, payload, cb);
    }

    /**
       Gets the Actions object that wraps the possible responses of an incomming message or event
       @private
     */
    _getActionsObject(event) {
        const convId = event.conversation
            ? (event.conversation.id || event.conversation) : event.id;
        if (!convId) {
            console.log('noconv', JSON.stringify(event));
            //throw new Error('Invalid event');
            return {};
        }
        if (!this.conversations[convId]) {
            console.error('missing conv', convId);
        }
        const command = (text) => {
            this.sendMessage(
                convId,
                { text, type: 'command', user: this.uid },
                (err) => {
                    if (err) {
                        console.error(`${text} error`, err.toString());
                    }
                }
            );
        };
        return Object.assign({}, this.conversations[convId] || {}, {
            //reply: this.sendMessage.bind(this, convId),
            say: this.sendMessage.bind(this, convId),
            accept: () => command('/accept'),
            join: () => command('/join'),
            leave: () => command('/leave'),
            set: (key, val) => command(`/set ${key} ${val}`),
            get: key => ((this.conversations[convId] || {}).meta || {})[key]
            //ask: this.sendMessage.bind(this, convId), //+buttons
        });
    }

    /**
       @private
     */
    _handleEvent(type, event) {
        // console.log('_handleEvent', type, event.message ? event.message.text : event.text);
        this.middleware.receive.run([this, event], (err) => {
            if (err) {
                this.emit('error', { type: 'middleware', message: `middleware receive processing error:  ${err}` });
                return;
            }
            const isMessage = type.startsWith('message');
            if (isMessage && event.data && event.data.message
                && event.data.message.user === this.auth.user
            ) {
                debug('Skip self-sent message');
            } else if (isMessage && event.data && event.data.message) {
                this.emit(type, event.data.message, this._getActionsObject(event.data));
            } else {
                this.emit(type, event); //, this._getActionsObject(event.data));
            }
        });
    }

    /**
      @private
     */
    _handleMessage(payload) {
        //console.log('_handleMessage', payload.type);
        if (payload.user === this.auth.user) {
            debug('Skip handling self-sent message');
            return;
        }
        //this._handleEvent(['message', payload.type, `${payload.type}.${payload.role}`], payload);
        //debug('user', payload.user, this.auth.user);
        this._handleEvent('message', payload);
        this._handleEvent(payload.type, payload);
        if (payload.type === 'chat' || payload.type === 'postback') {
            this._handleEvent(`${payload.type}.${payload.role}`, payload);
        } else if (payload.type === 'command') {
            this._handleEvent(`command_${payload.text.substr(1)}`, payload);
        }
    }
}

const RESOURCES = [
    'User', 'UserGroup', 'Channel',
    'Contact', 'Conversation', 'Message',
    'Organization', 'OrganizationGroup', 'Service', 'Form',
    'Workflow', 'Metric',
    'Kbase', 'Kbitem', 'Article', 'Event', 'File', 'Location'
];

RESOURCES.forEach((resource) => {
    // eslint-disable-next-line prefer-template
    const path = resource.toLowerCase().replace('organizationgroup', 'orggroup') + 's';
    /* eslint-disable func-names */
    ChipChat.prototype[`list${resource}s`] = function (options, cb) {
        return this._request('GET', path, options, cb);
    };
    ChipChat.prototype[`get${resource}`] = function (id, cb) {
        return this._request('GET', `${path}/${id}`, null, cb);
    };
    ChipChat.prototype[`create${resource}`] = function (body, cb) {
        return this._request('POST', path, body, cb);
    };
    ChipChat.prototype[`update${resource}`] = function (id, body, cb) {
        return this._request('PATCH', `${path}/${id}`, body, cb);
    };
    ChipChat.prototype[`delete${resource}`] = function (id, cb) {
        return this._request('DELETE', `${path}/${id}`, { force: true }, cb);
    };
});

ChipChat.mixin = function (methods) {
    Object.keys(methods).forEach((method) => {
        this.prototype[method] = methods[method];
    });
    /*for (var i in methods) {
        if (methods.hasOwnProperty(i)) {
            this.prototype[i] = methods[i];
        }
    }*/
};

module.exports = ChipChat;
