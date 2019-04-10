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
    'users', 'usergroups', 'channels',
    'contacts', 'conversations', 'messages',
    'organizations', 'orggroups', 'services', 'forms',
    'workflows', 'metrics',
    'kbases', 'kbitems', 'articles', 'files'
];

/**
   REST API Handler
*/
const RestAPI = API => class extends API {
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
                delete: (id, cb) => this._request('DELETE', `${path}/${id}`, { force: true }, cb)
            };
        });
    }

    /**
       Wraps the request with API auth and default options
       @private
    */
    _request(method, path, json, cb) {
        const querystring = (method === 'GET' || method === 'DELETE') && json
            ? `?${buildQs(json)}` : '';

        return request({
            method,
            uri: `${this.host}/v2/${path}${querystring}`,
            //qs: method === 'GET' ? json : null, //this._getQs(json),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
                'User-Agent': 'chipchat/0.0.1'
            },
            body: method === 'GET' || method === 'DELETE' ? null : json,
            json: true // Automatically parses the JSON string in the response
        })
            .then((body) => {
                if (body && body.error) return Promise.reject(body.error);
                if (!cb) return Promise.resolve(body);
                setTimeout(() => { cb(null, body); }, 0);
                return null;
            })
            .catch((err) => {
                if (!cb) return Promise.reject(err);
                setTimeout(() => { cb(err, null); }, 0);
                return null;
            });
    }

    /**
       Proxy-forwards incoming Smooch messages for dev localhost setups,
       so bots and Smooch webhooks can be served from a single ngrok url.
       @private
    */
    _smoochProxy(req, res) {
        request({
            method: 'POST',
            uri: `${this.host}/webhooks/smooch`,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body),
            json: true
        }).then(() => {
            res.status(200).end();
        });
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
    sendMessage(conversation, payload, cb) {
        if (typeof payload === 'string') {
            payload = { text: payload };
        }
        const data = Object.assign({}, payload, { conversation });
        this.middleware.send.run([this, data], (err) => {
            if (err) {
                this.emit('error', { type: 'middleware', message: `middleware send processing error:  ${err}` });
                return;
            }
            debug('postdata', JSON.stringify(data));
            this._request('POST', 'messages', data, cb);
        });
    }
};

module.exports = RestAPI;
