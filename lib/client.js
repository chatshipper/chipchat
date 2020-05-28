/**
   REST API Main module
   For the API reference see: https://developers.chatshipper.com
   @module chipchat/client
   @author Chatshipper
*/

'use strict';

const request = require('request-promise');
const debug   = require('debug')('chipchat:rest');

/**
   Builds the query string from options object taking in to account dot notation path, so:
   { mischa: { likes: { javascript: true, enduro: true}}, other: [1,2,3]} will become
   mischa.likes.javascript=true&mischa.likes.enduro=true&other=[1,2,3]
   @private
*/
function buildQs(options) {
    if (typeof options === 'string') {
        return options.startsWith('?') ? options : `?${options}`;
    }
    if (typeof options !== 'object') {
        throw new Error('Cannot build query string, options not an object');
    }
    /* eslint-disable no-param-reassign */
    const flatten = (source, flattened = {}, keySoFar = '') => {
        const getNextKey = key => `${keySoFar}${keySoFar ? '.' : ''}${key}`;
        if (Array.isArray(source)) {
            flattened[keySoFar] = `[${source.map(val => encodeURIComponent(val)).join(',')}]`;
        } else if (typeof source === 'object') {
            Object.keys(source).forEach((key) => {
                flatten(source[key], flattened, getNextKey(key));
            });
        } else {
            flattened[keySoFar] = encodeURIComponent(source);
        }
        return flattened;
    };

    const flat = flatten(options);
    const out = Object.keys(flat).map(key => `${key}=${flat[key]}`).join('&');
    return out;
}

const RESOURCES = [
    'users', 'channels', //'usergroups',
    'contacts', 'conversations', 'messages',
    'organizations', 'orggroups', 'services', 'forms',
    'workflows', 'metrics',
    'kbases', 'kbitems', 'articles', 'files', 'locations'
];

/**
 * This provides methods used for doing API requests. It's not meant to
 * be used directly.
 *
 * @mixin
 */
const RestAPI = API => class extends API {
    /**
     * @name ChipChat#users
     * @property {object}
     * @memberof ChipChat
     * @description Users CRUD methods object
     */
    /**
     * @name ChipChat#users.list
     * @function
     * @memberof ChipChat#users
     * @description Users CRUD methods object
     * @param {options} search options
     */
    /**
     * @name ChipChat#users.get
     * @function
     * @memberof ChipChat#users
     * @description Fetch a user
     * @param {options} selection and population options
     */
    /**
     * @name ChipChat#contacts
     * @property {object}
     * @memberof ChipChat
     * @description Contact CRUD methods object
     */
    _initApi() {
        RESOURCES.forEach((path) => {
            this[path] = {
                list: (options, cb) => this._request('GET', path, options, cb),
                get: (id, options, cb) => {
                    if (!cb && typeof options === 'function') {
                        cb = options;
                        options = null;
                    }
                    return this._request('GET', `${path}/${id}`, options, cb);
                },
                create: (body, cb) => this._request('POST', path, body, cb),
                update: (id, body, cb) => this._request('PATCH', `${path}/${id}`, body, cb),
                delete: (id, cb) => this._request('DELETE', `${path}/${id}?force: true`, null, cb)
            };
        });
        // backwards-compat
        this.sendMessage = this.send.bind(this);
    }

    /**
       Wraps the request with API auth and default options
       @private
    */
    _request(method, path, json, cb) {
        if (!this.token) {
            throw new Error('Auth token not specified');
        }
        const querystring = method === 'GET' && json ? `?${buildQs(json)}` : '';
        const options = {
            method,
            uri: `${this.host}/v2/${path}${querystring}`,
            //qs: method === 'GET' ? json : null, //this._getQs(json),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
                'User-Agent': 'chipchat/0.1.7'
            },
            body: method === 'POST' || method === 'PATCH' || method === 'DELETE' ? json : null,
            // Automatically parses the JSON string in the response
            // and stringifies the body to JSON on POST/PATCH
            json: true,
            resolveWithFullResponse: true
        };
        return request(options)
            .then((response) => {
                const body = response.body;
                if (Array.isArray(body)) {
                    body.headers = Object.keys(response.headers).filter(k => /^x-/.test(k)).reduce((map, key) => {
                        const normKey = key.replace(/^x-/, '').replace(/-([a-z])/g, (g) => { return g[1].toUpperCase(); });
                        map[normKey] = response.headers[key];
                        return map;
                    }, {});
                }
                if (body && body.error) return Promise.reject(body.error);
                if (!cb) return Promise.resolve(body);
                setTimeout(() => { cb(null, body); }, 0); // next tick
                return null;
            })
            .catch((err) => {
                if (this.auth.refreshToken && /jwt expired/i.test(err.toString())) {
                    this._refreshToken((err0, res) => {
                        if (err0) {
                            if (!cb) return Promise.reject(err0);
                            return setTimeout(() => { cb(err0, null); }, 0); // next tick
                        }
                        this.token = res.token;
                        this.auth.refreshToken = res.refreshToken;

                        this.emit('token', res.token);
                        return this._request(method, path, json, cb);
                    });
                }
                if (!cb) return Promise.reject(err);
                setTimeout(() => { cb(err, null); }, 0); // next tick
                return null;
            });
    }

    _refreshToken(cb) {
        const payload = {
            clientId: this.auth.email,
            refreshToken: this.auth.refreshToken
        };
        this._request('POST', 'auth/token', payload, cb);
    }

    /**
       @callback restCallback
       @param {error} null on success, {string|object} on error
       @param {document} JSON document response
    */
    /**
       Sends a message to the given conversation
       @param {string} conversation - Target conversation
       @param {string|object} payload - Message,
       @param {restCallback} cb - The callback that handles the response
    */
    send(conversation, payload, extra, cb) {
        if (typeof payload === 'string') {
            payload = { text: payload };
        }
        if (!cb && extra && typeof extra === 'function') {
            // extra is the callback
            cb = extra;
            extra = null;
        } else if (extra) {
            payload = Array.isArray(payload)
                ? payload.map(p => Object.assign({}, p, extra))
                : Object.assign({}, payload, extra);
        }
        // merge in conversation ID for middleware to use
        payload = Array.isArray(payload)
            ? payload.map(p => Object.assign({}, p, { conversation }))
            : Object.assign({}, payload, { conversation });
        return new Promise((resolve, reject) => {
            this.middleware.send.run([this, payload], (err) => {
                if (err) {
                    this.emit('error', { type: 'middleware', message: `middleware send processing error:  ${err}` });
                    reject(err);
                }
                debug('postdata', JSON.stringify(payload));
                this._request('POST', `conversations/${conversation}/messages`, payload, cb).then(resolve).catch(reject);
            });
        });
    }
};

module.exports = RestAPI;
