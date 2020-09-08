/**
   REST API Main module
   For the API reference see: https://developers.chatshipper.com
   @module chipchat/client
   @author Chatshipper
*/

'use strict';

const fetch = require('got');
const debug   = require('debug')('chipchat:rest');
const DEFAULTPAGINATIONLIMIT = 100;

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
        const getNextKey = (key) => `${keySoFar}${keySoFar ? '.' : ''}${key}`;
        if (Array.isArray(source)) {
            flattened[keySoFar] = `[${source.map((val) => encodeURIComponent(val)).join(',')}]`;
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
    const out = Object.keys(flat).map((key) => `${key}=${flat[key]}`).join('&');
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
const RestAPI = (API) => class extends API {
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
       Prepares the options for a request
       Returns Object with all options
       @private
    */
    _getOptions(method, path, json) {
        // get default params of pagination in correct order
        // limit and offset could be configured in json as well.
        const {
            searchParams,
            pagination,
            limit = pagination.limit || json.limit || DEFAULTPAGINATIONLIMIT,
            offset = pagination.offset || json.offset || 0,
            ...queryOptions
        } = json;
        // Create querystring. With pagination, only queryOptions should be passed as querystring (see 1)
        const querystring = method === 'GET' && json ? `?${buildQs(pagination ? queryOptions : json )}` : '';
        const options = {
            method,
            prefixUrl: this.host,
            url: `v2/${path}${querystring}`,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
                'User-Agent': 'chipchat/0.1.8'
            },
            responseType: 'json',
            throwHttpErrors: false // we want to handle errors in body
        };
        if (['POST', 'PATCH', 'DELETE'].includes(method)) {
            options.json = json;
        }
        if (pagination && method === 'GET') {
            // (1) Because with pagination all options go into searchParams
            options.searchParams = { ...searchParams, ...queryOptions, limit, offset };
            // Setup pagination
            options.pagination = {
                ...pagination,
                paginate: response => {
                    // use default paginate function, but fix searchParams.
                    const newOptions = fetch.defaults.options.pagination.paginate(response);
                    if (newOptions) {
                        console.log('next: ', newOptions.url.href)
                        newOptions.searchParams = newOptions.url.searchParams;
                    }
                    return newOptions;
                }
            };
        }
        return options;
    }

    /**
       Wraps the request with API auth and default options
       Returns Promise if no cb (callback) is given
       @private
    */
    _request(method, path, json, cb) {
        debug(`${method} request to ${path}`, json);
        if (!this.token) {
            throw new Error('Auth token not specified');
        }
        const options = this._getOptions(method, path, json);
        const func = json && json.pagination ? (json.pagination.iterate ? fetch.paginate.each : fetch.paginate.all) : fetch;;
        const req = func(options)
            .then(async (response) => {
                if (response.statusCode === 401 && this.auth.refreshToken && /jwt expired|invalid signature/i.test(response.body.error.message)) {
                    debug('refresh token', this.auth.email);
                    // get refresh tokens
                    const payload = {
                        clientId: this.auth.email,
                        refreshToken: this.auth.refreshToken
                    };
                    const tokens = await fetch(this._getOptions('POST', 'auth/token', payload));
                    this.token = tokens.body.token;
                    this.auth.refreshToken = tokens.body.refreshToken;
                    this.emit('token', tokens.body.token);
                    const retryOptions = this._getOptions(method, path, json);
                    return fetch(retryOptions);
                }
                // or just pass tru to next then
                return response;
            })
            .then((response) => {
                if (json && json.pagination) return response;
                const body = response.body;
                if (Array.isArray(body)) {
                    body.headers = Object.keys(response.headers).filter((k) => /^x-/.test(k)).reduce((map, key) => {
                        const normKey = key.replace(/^x-/, '').replace(/-([a-z])/g, (g) => { return g[1].toUpperCase(); });
                        map[normKey] = response.headers[key];
                        return map;
                    }, {});
                }
                if (body && body.error) {
                    if (cb) {
                        return setTimeout(() => { cb(body.error, null); }, 0); // next tick
                    }
                    return Promise.reject(response);
                }
                if (!cb) return Promise.resolve(body);
                return setTimeout(() => { cb(null, body); }, 0); // next tick
            });
        if (!cb) return req;
        return true;
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
        debug('send', conversation, payload, extra, cb);
        if (typeof payload === 'string') {
            payload = { text: payload };
        }
        if (!cb && extra && typeof extra === 'function') {
            // extra is the callback
            debug('extra becomes callback');
            cb = extra;
            extra = null;
        }
        if (cb && typeof cb !== 'function') {
            debug('callback is not a function');
            throw new Error('callback should be a function');
        }
        if (extra) {
            if (typeof extra !== 'object') {
                debug('options is not an object');
                throw new Error('options is not an object');
            }
            payload = Array.isArray(payload)
                ? payload.map((p) => ({ ...p, ...extra }))
                : { ...payload, ...extra };
        }
        const handleError = (callback, reject, err) => {
            if (err) {
                const error = (err.body || {}).error || err;
                debug('send middleware returned error', error);
                this.emit('error', { type: 'middleware', message: `middleware send processing error: ${error.message || error}` });
                if (callback) {
                    callback(error, null);
                } else if (reject) {
                    reject(error);
                } else {
                    throw new Error(error);
                }
                return true;
            }
            return false;
        };
        // middleware runner that handles both callback and reject
        const runMiddleware = (callback, resolve, reject) => {
            // merge in conversation ID for middleware to use
            payload = Array.isArray(payload)
                ? payload.map((p) => ({ ...p, conversation }))
                : { ...payload, conversation };
            this.middleware.send.run([this, payload], (err) => {
                debug('send middleware finished', err);
                if (!handleError(callback, reject, err)) {
                    debug(`postdata with ${callback ? 'callback' : 'promise'}`, JSON.stringify(payload));
                    const finished = callback ? callback.bind(null, null) : resolve;
                    this._request('POST', `conversations/${conversation}/messages`, payload)
                        .then(finished)
                        .catch(handleError.bind(this, callback, reject));
                }
            });
        };
        if (cb) {
            return runMiddleware(cb);
        }
        return new Promise((resolve, reject) => runMiddleware(null, resolve, reject));
    }
};

module.exports = RestAPI;
