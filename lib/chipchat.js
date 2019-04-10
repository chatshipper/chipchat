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
   * Middleware that ignores messages from this bot user (self).
   *
   * @api private
   */
function ignoreSelfMiddleware() {
    return (bot, payload, next) => {
        if (!payload.event) {
            console.log('invalidpayload', JSON.stringify(payload));
            bot.emit('error', { code: 'Invalid payload' });
            return;
        }
        if (payload.event.startsWith('message')
            && payload.data.message.user === bot.auth.user
        ) {
            debug('ignoreSelf', payload.data.message.text);
            return;
        }
        next();
    };
}

/**
   * Middleware that ignores messages from any bot user
   *
   * @api private
   */

function ignoreBotsMiddleware() {
    return (bot, payload, next) => {
        if (!payload.event) {
            console.log('invalidpayload', JSON.stringify(payload));
            bot.emit('error', { code: 'Invalid payload' });
            return;
        }
        if (payload.event.startsWith('message')
            && payload.data.message.role === 'bot'
        ) {
            debug('ignoreBots');
            return;
        }
        next();
    };
}

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
       @param {boolean} opts.ignoreSelf - defaults to `true`, `true` to automatically ignore
         any messages from yourself.
       @param {boolean} opts.ignoreBots - defaults to `true`, `true` to ignore any messages
         from bot users automatically
       @param {Boolean} [options.onlyFirstMatch=false] Set to true to stop after first match.
         Otherwise, all regexps are executed.
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

        this.onlyFirstMatch = typeof opts.onlyFirstMatch === 'boolean' ? opts.onlyFirstMatch : false;
        this.ignoreBots = typeof opts.ignoreBots === 'boolean' ? opts.ignoreBots : true;
        this.ignoreSelf = typeof opts.ignoreSelf === 'boolean' ? opts.ignoreSelf : true;
        if (this.ignoreSelf) {
            this.use(ignoreSelfMiddleware());
        }
        if (this.ignoreBots) {
            this.use(ignoreBotsMiddleware());
        }

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

        this.conversations = {};
        this.organizations = {};
        this._orgMap = {};
        this.preloadOrganizations = true;

        this._registeredCallbacks = {};
        this._textRegexpCallbacks = [];
        this._replyListenerId = 0;
        this._replyListeners = [];

        this._initApi();
    }

    use(...args) {
        this.middleware.receive.use(...args);
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

    mixin(methods) {
        Object.keys(methods).forEach((method) => {
            this.prototype[method] = methods[method];
        });
    }

    ingest(payload) {
        if (!payload || !payload.event) {
            this.emit('error', { type: 'ingest', message: 'Invalid payload, missing event' });
            return;
        }
        debug('ingest %s event', payload.event, Object.keys(payload).join(','));
        if (payload.event.startsWith('message')) {
            if (!payload.data.conversation) {
                this.emit('error', { type: 'ingest', message: 'Invalid payload, missing conversation' });
                return;
            }
            // Set the conversation for this request, to later build the chat object from
            this.conversations[payload.data.conversation.id] = payload.data.conversation;

            let isHandled = false;
            // Preload organization if configured
            if (!this.organizations[payload.data.conversation.organization]
                && this.preloadOrganizations
            ) {
                this.organizations
                    .get(payload.data.conversation.organization, { populate: 'categories.forms' })
                    .then((org) => {
                        this.organizations[org.id] = org;
                        //this._orgMap[payload.data.conversation.id] = org.id;
                        debug('cachedorg', org.id);
                        this._handleEvent(payload.event, payload);
                    })
                    .catch(err => debug('err', err));
                isHandled = true;
            } else if (this.preloadOrganizations && !this._orgMap[payload.data.conversation.id]) {
                //this._orgMap[payload.data.conversation.id] =
                //  payload.data.conversation.organization;
            }
            if (!isHandled) {
                this._handleEvent(payload.event, payload);
            }
        } else if (payload.event === 'channel.notify') {
            this._handleEvent('notify', payload.data.message);
        } else if (payload.activity) {
            this._handleEvent('activity', payload.event, payload.activity);
        } else {
            debug('unknown event', Object.keys(payload.data)); // JSON.stringify(payload, null, 4));
        }
    }

    registerCallback(name, callback) {
        this._registeredCallbacks[name] = callback;
    }

    on(event, listener) {
        debug('on.event', event);
        if (event === 'message') { event = 'message.**'; }
        super.on(event, listener);
        return this;
    }

    /**
     * Register a RegExp to test against an incomming text message.
     * @param  {RegExp}   regexp       RegExp to be executed with `exec`.
     * @param  {Function} callback     Callback will be called with 2 parameters,
     * the `msg` and the result of executing `regexp.exec` on message text.
     */
    onText(triggers, callback) {
        if (!Array.isArray(triggers)) {
            triggers = [triggers];
        }
        triggers
            .map(text => (text instanceof RegExp ? text : new RegExp(text, 'i')))
            .forEach(
                regexp => this._textRegexpCallbacks.push({ regexp, callback })
            );
        return this;
    }

    /**
     * Remove a listener registered with `onText()`.
     * @param  {RegExp} regexp RegExp used previously in `onText()`
     * @return {Object} deletedListener The removed reply listener if
     *   found. This object has `regexp` and `callback`
     *   properties. If not found, returns `null`.
     */
    removeTextListener(regexp) {
        const index = this._textRegexpCallbacks.findIndex((textListener) => {
            return textListener.regexp === regexp;
        });
        if (index === -1) {
            return null;
        }
        return this._textRegexpCallbacks.splice(index, 1)[0];
    }

    /**
     * Register a reply to wait for a message response.
     * @param  {Number|String}   chatId       The chat id where the message cames from.
     * @param  {Number|String}   messageId    The message id to be replied.
     * @param  {Function} callback     Callback will be called with the reply
     *  message.
     * @return {Number} id                    The ID of the inserted reply listener.
     */
    onReply(chatId, messageId, callback) {
        const id = ++this._replyListenerId; // eslint-disable-line no-plusplus
        debug('add reply listener', id, chatId, messageId);
        this._replyListeners.push({
            id,
            chatId,
            messageId,
            callback
        });
        return id;
    }

    /**
     * Removes a reply that has been prev. registered for a message response.
     * @param   {Number} replyListenerId      The ID of the reply listener.
     * @return  {Object} deletedListener      The removed reply listener if
     *   found. This object has `id`, `chatId`, `messageId` and `callback`
     *   properties. If not found, returns `null`.
     */
    removeReplyListener(replyListenerId) {
        const index = this._replyListeners.findIndex((replyListener) => {
            return replyListener.id === replyListenerId;
        });
        debug('removeReplyListener', index);
        if (index === -1) {
            return null;
        }
        return this._replyListeners.splice(index, 1)[0];
    }

    /**
       Gets the Actions object that wraps the possible responses of an incomming message or event
       @private
     */
    _getActionsObject(convId) {
        if (!convId || !this.conversations[convId]) {
            this.emit('error', { message: `missing conv ${convId}` });
            return {};
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
            //organization: this.organizations[this._orgMap[convId]]
            organization: this.organizations[this.conversations[convId]]
                || (this.conversations[convId] || {}).organization,
            say: this.sendMessage.bind(this, convId),
            accept: () => command('/accept'),
            join: () => command('/join'),
            leave: () => command('/leave'),
            notify: () => command('/notify'),
            set: (key, val) => command(`/set ${key} ${val}`),
            get: key => ((this.conversations[convId] || {}).meta || {})[key],
            ask: (q, cb) => {
                this.sendMessage(convId, q, (e, msg) => {
                    if (e) { return this.emit('error', e); }
                    command(`/set _asked${this.auth.user} ${msg.id}`);
                    const id = this.onReply(convId, msg.id, (m) => {
                        debug('ask.answered', m.text);
                        this.removeReplyListener(id);
                        const c = this._getActionsObject(convId);
                        if (typeof cb === 'string') {
                            this._registeredCallbacks[cb](m, c);
                        } else {
                            cb(m, c);
                        }
                    });
                    return id;
                });
            }
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
            const isMessage = type.startsWith('message') || type === 'channel.notify';
            if (isMessage && event.data && event.data.message) {
                this._handleMessage(type, event.data.message);
            } else {
                debug('nonmsg', type);
                this.emit(type, event);
            }
        });
    }

    /**
       @private
     */
    _handleMessage(type, message) {
        const ctx = this._getActionsObject(message.conversation);
        //debug('handleMessage', ctx.id);

        let hasReplied = false;
        if (type !== 'channel.notify' && message.text && (message.role === 'contact' || message.role === 'agent')) {
            //debug('Text message');
            this._textRegexpCallbacks.some((reg) => {
                debug('Matching %s with %s', message.text, reg.regexp);
                const result = reg.regexp.exec(message.text);
                if (!result) {
                    return false;
                }
                // reset index so we start at the beginning of the regex each time
                reg.regexp.lastIndex = 0;
                debug('Matches %s', reg.regexp);
                reg.callback(message, result);
                // returning truthy value exits .some
                return this.onlyFirstMatch;
            });

            const questionAsked = ctx.get(`_asked${this.auth.user}`);
            debug('text message', questionAsked, this._replyListeners.length);
            if (questionAsked) {
                // Only callbacks waiting for this message
                this._replyListeners.forEach((reply) => {
                    debug('checklistener', reply.chatId, message.conversation);
                    // Message from the same chat
                    if (reply.chatId === message.conversation) {
                        // Responding to that message
                        //if (reply.messageId === questionAsked) {
                        // Resolve the promise
                        let callback = reply.callback;
                        if (typeof reply.callback === 'string') {
                            callback = this._registeredCallbacks[reply.callback];
                        }
                        callback(message);
                        hasReplied = true;
                        //}
                    }
                });
            }
        }
        if (!hasReplied) {
            this.emit(type, message, ctx);
            if (message.type === 'chat' || message.type === 'postback') {
                this.emit(`${message.type}.${message.role}`, message, ctx);
            }
        }
    }
}

module.exports = ChipChat;
