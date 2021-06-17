/**
   REST API Main module
   For the API reference see: https://developers.web1on1.chat
   @module chipchat/client
   @author Web1on1
*/

'use strict';

const fetch = require('got');
const debug = require('debug')('chipchat:client');
const { version } = require('../package.json');

const DEFAULTPAGINATIONLIMIT = 100; // default slice size pagination
const DEFAULTPAGINATIONBACKOFF = 100; // default sleep time in betweeen getting pagination slices
const DEFAULTPAGINATIONCOUNTLIMIT = 2000; // pagination count limit. stops itterating when reached

/**
   Fixes the headers of a request
   @private
*/
function fixHeaders(response) {
    return Object.keys(response.headers).filter((k) => /^x-/.test(k)).reduce((map, key) => {
        const normKey = key.replace(/^x-/, '').replace(/-([a-z])/g, (g) => { return g[1].toUpperCase(); });
        map[normKey] = response.headers[key];
        return map;
    }, {});
}

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
    'users', 'bots', 'botinstances', 'channels', //'usergroups',
    'contacts', 'conversations', 'messages',
    'organizations', 'orggroups', 'partners', 'services', 'forms',
    'workflows', 'metrics', 'points',
    'kbases', 'kbitems', 'articles', 'files', 'locations', 'watemplates',
    'partners'
];

/**
   Extends Got to handle authentication and error handling via hooks
   Can only be called once. Will become empty shell after first call.
   @private
   */
const extendFetch = (instance, opts = {}) => {
    // extend fetch to handle token refresh
    const extFetch = fetch.extend({
        hooks: {
            ...opts,
            beforeError: (opts.beforeError || []).concat([
                error => {
                    const { response } = error;
                    if (response) {
                        if (response.statusCode) {
                            error.statusCode = response.statusCode;
                        }
                        if (response.body
                            && response.body.error && response.body.error.message) {
                            error.message = response.body.error.message;
                        }
                    }

                    return error;
                }
            ]),
            beforeRequest: (opts.beforeRequest || []).concat([
                async (options) => {
                    const tokens = await instance._getTokens();
                    if (tokens.token) {
                        options.headers = {
                            ...options.headers,
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'User-Agent': `chipchat/${version}`,
                            'Authorization': `Bearer ${tokens.token}`
                        };
                    } else {
                        throw new Error('token should be specified');
                    }
                }
            ]),
            afterResponse: (opts.afterResponse || []).concat([
                async (response, retryWithMergedOptions) => {
                    if (response.statusCode === 401 && instance.auth.refreshToken
                        && response.body.error
                        && /jwt expired|invalid signature|invalid token/i.test(response.body.error.message)) {
                        const options = {
                            headers: {
                                ...extFetch.defaults.options.headers,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'User-Agent': 'chipchat/0.1.8'
                            }
                        };
                        if (instance.getTokens && typeof instance.getTokens === 'function') {
                            // do have a store tokens that might work, lets try that first
                            const storeTokens = await instance.getTokens();
                            if (storeTokens && storeTokens.token
                                && storeTokens.token !== instance.auth.token) {
                                instance.auth.token = storeTokens.token;
                                debug('retry with tokens from store ...', storeTokens.token.slice(-10));
                                return retryWithMergedOptions(options);
                            }
                        }
                        // else we get refresh tokens from CS
                        const payload = {
                            clientId: instance.auth.email,
                            refreshToken: instance.auth.refreshToken
                        };
                        debug(`get new tokens using email: ${instance.auth.email} and refresh token ...${instance.auth.refreshToken.slice(-10)}`);
                        return extFetch(instance._getOptions('POST', 'auth/token', payload)).then(async (tokens) => {
                            debug('new tokens', tokens.body);
                            const newTokens = tokens.body;
                            await instance._setTokens(newTokens);
                            instance.emit('token', newTokens.token);

                            return retryWithMergedOptions(options);
                        });
                    }
                    if (response.statusCode === 401) {
                        debug(`401: ${JSON.stringify(response.body)}`);
                    }

                    // No changes otherwise
                    return response;
                }
            ])
        },
        mutableDefaults: true
    });

    // return the cloned version with all extras
    return extFetch;
};

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
    _initApi(opts) {
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
            if (path === 'messages') {
                this[path].replace = (id, body, cb) => this._request('PUT', `${path}/${id}`, body, cb);
            }
        });
        // backwards-compat
        this.sendMessage = this.send.bind(this);

        // create a local fetch instance
        this.fetch = extendFetch(this, opts.fetchExtensions || {});
    }

    /**
       Tokens are by default only stored in memory
       This function can be overruled with a mixin or module
       to provide an alternative to store the tokens
       like Google Secret Store or AWS Secret Store etc,
       which is needed for cloud functions that can run on
       multiple instances.
       The function is setup async on purpose as we
       expect the overruled function will need this.
       @public
    */
    async _getTokens() {
        if (this.auth && this.auth.token) {
            // return cache
            return this.auth;
        }
        if (typeof this.getTokens === 'function') {
            debug('using mixin getTokens');
            const tokens = await this.getTokens();
            if (tokens && tokens.token && tokens.refreshToken) {
                // update cache
                this.auth = {
                    ...this.auth,
                    ...tokens
                };
                // return cache
                return this.auth;
            }
        }
        return {};
    }

    async _setTokens(tokens) {
        // update cache
        this.auth = {
            ...this.auth,
            ...tokens
        };
        // update store id defined
        if (typeof this.setTokens === 'function') {
            debug('using mixin setTokens');
            return this.setTokens(tokens);
        }
        return this.auth;
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
            pagination = this.pagination,
            ...queryOptions
        } = (json || {});
        const limit = (pagination && pagination.limit)
            || (json && json.limit) || this.limit
            || (pagination && DEFAULTPAGINATIONLIMIT);
        const offset = (pagination && pagination.offset)
            || (json && json.offset) || 0;
        if (pagination) {
            pagination.backoff = pagination.backoff || DEFAULTPAGINATIONBACKOFF;
            pagination.countLimit = pagination.countLimit || DEFAULTPAGINATIONCOUNTLIMIT;
        }
        // With pagination, only queryOptions should be passed as querystring (see 1)
        const querystring = method === 'GET' && json ? `?${buildQs(pagination ? queryOptions : json)}` : '';
        const options = {
            method,
            prefixUrl: this.host,
            responseType: 'json',
            url: `v2/${path}${querystring}`
        };
        debug('using options:', JSON.stringify(options));
        if (['POST', 'PATCH', 'DELETE'].includes(method)) {
            options.json = json;
        }
        if (pagination && method === 'GET') {
            // (1) Because with pagination all options go into searchParams
            options.searchParams = buildQs({ ...searchParams, ...queryOptions, limit, offset });
            // Setup pagination
            options.pagination = {
                ...pagination,
                paginate: response => {
                    // Run got's paginate
                    let newOptions;
                    try {
                        newOptions = this.fetch.defaults
                            .options.pagination.paginate(response);
                    } catch (ep) {
                        // no pagination
                        return false;
                    }
                    // Update searchParams
                    if (newOptions) {
                        debug('next: ', newOptions.url.href);
                        newOptions.searchParams = newOptions.url.searchParams;
                    }
                    return newOptions;
                }
            };
            debug('using pagination options:', JSON.stringify(options.pagination));
        }
        return options;
    }

    /**
       Wraps the request with API auth and default options
       Returns Promise if no cb (callback) is given
       @private
    */
    _request(method, path, json, cb) {
        debug(`${method} request to ${path}`);
        const options = this._getOptions(method, path, json);
        // pagination
        if (options.pagination) {
            if (method !== 'GET') {
                debug('pagination disabled for non GET requests');
                delete options.pagination;
            } else if (cb) {
                debug('pagination disabled in cb mode');
                delete options.pagination;
            } else {
                if (options.pagination.iterate) {
                    return this.fetch.paginate.each(options);
                }
                return this.fetch.paginate.all(options);
            }
        }
        // not pagination
        const req = this.fetch(options).then((response) => {
            const { body } = response;
            if (Array.isArray(body)) {
                body.headers = fixHeaders(response);
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
