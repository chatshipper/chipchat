const express    = require('express');
const bodyParser = require('body-parser');
const http       = require('http');

const debug      = require('debug')('chipchat:server');
const url        = require('url');
const path       = require('path');
const { getSignature } = require('./utils');

const { Router } = express;

const Server = (Webhooks) => class extends Webhooks {
    /**
     * Provides http/https middleware as the
     * {@link https://nodejs.org/api/http.html#http_http_createserver_options_requestlistener|requestlistener}
     * option to createServer.
     * @return {function} http middleware
     */
    httpMiddleware() {
        return (req, res) => {
            debug('httpMiddleware', req.method);
            // we always write 200, otherwise Google will keep retrying the request
            res.writeHead(200, { 'Content-Type': 'application/json' });
            if (req.method === 'GET') {
                // eslint-disable-next-line
                const challenge = url.parse(req.url, true).query.challenge;
                return res.end(challenge);
            }

            if (req.url === '/_status') return res.end(JSON.stringify({ status: 'ok' }));
            //if (this.verify_token && req.method === 'GET') return this._verify(req, res);
            if (req.method !== 'POST') return res.end();

            let body = '';

            req.on('data', (chunk) => {
                body += chunk;
            });

            req.on('end', () => {
                // check message integrity
                if (this.secret) {
                    const expected = req.headers['x-hub-signature'];
                    if (!expected) {
                        throw new Error('Missing signature on incoming request');
                    }
                    const calculated = getSignature(body, this.secret);
                    if (calculated !== expected) {
                        this.emit('error', new Error('Message integrity check failed'));
                        return res.end(JSON.stringify({ status: 'not ok', error: 'Message integrity check failed' }));
                    }
                }
                const parsed = JSON.parse(body);
                try {
                    this.ingest(parsed);
                    return res.end(JSON.stringify({ status: 'ok' }));
                } catch (e) {
                    debug('err', e);
                    this.emit('error', e);
                    return res.end(JSON.stringify({ status: 'not ok', error: 'Message processing failed' }));
                }
            });

            return null;
        };
    }

    /**
     * Starts the {@link http://expressjs.com|express} server on the specified port. Defaults port to 3000.
     * @param {Number} [port=3000]
     */
    start(port) {
        this.app = express();
        this.app.set('port', port || process.env.PORT || 3000);
        //this.router(this.webhook, this.app);
        this.router({ pathPrefix: this.webhook, app: this.app, async: true });

        this.server = http.createServer(this.app);
        this.server.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.log('Address in use, retrying...');
                setTimeout(() => {
                    this.server.close();
                    this.server.listen(this.app.get('port'));
                }, 5000);
            } else {
                debug('Server startup error', e.message);
                throw e;
            }
        });
        this.server.listen(this.app.get('port'), (err) => {
            if (err) {
                this.emit('error', { message: `Server start error: ${err.toString()}` });
            }
            console.log(`ChipChat Webhook running on localhost:${this.server.address().port}${this.webhook}`);
            this.emit('ready', {});
        });
        return this;
    }

    /**
     * Get an {@link http://expressjs.com|express} router that can be used to
     * expose HTTP endpoints
     *
     * ```
     * module.exports = bot => {
     *   // Get an express router to expose new HTTP endpoints
     *   const routes = bot.router('/my-webhook');
     *
     *   // Use any middleware
     *   routes.use(require('express').static(__dirname + '/public'));
     *
     *   // Add a new route
     *   routes.get('/hello-world', (req, res) => {
     *     res.end('Hello World');
     *   });
     * };
     * ```
     * ...or apply ChipChat routes in your own express app:
     * ```
     * const express = require('express');
     * const app = express();
     * bot.router('/my-webhook', app);
     * // or
     * bot.router({ prefix: '/my-webhook', app);
     * app.listen();
     * ````
     *
     * @param {object} options - router Options
     * @param {string} [options.prefix] - the prefix for the routes
     * @param {string} [options.app] - the Express app to attach the routes to
     * @param {string} [options.async] - make `ingest` return promise
     * Alternative typical router interface
     * @param pathPrefix - the prefix for the routes
     * @param app - the Express app to attach the routes to
     * @returns the provided app or a new [express.Router](http://expressjs.com/en/4x/api.html#router)
     */
    router(pathPrefix, app) {
        const opts = (typeof pathPrefix === 'object') ? pathPrefix : { pathPrefix };
        const npath = opts.pathPrefix && opts.pathPrefix.charAt(0) !== '/' ? `/${opts.pathPrefix}` : (opts.pathPrefix || '/');
        const napp = (typeof pathPrefix === 'object' && pathPrefix.app) ? pathPrefix.app : app || Router();

        /**
            Verifies the SHA1 signature of the raw request payload before bodyParser parses it
            Will abort parsing if signature is invalid, and pass a generic error to response
            Read more: https://github.com/expressjs/body-parser#verify
        */
        const verifyRequest = (req, res, buf, encoding) => {
            const expected = req.get('x-hub-signature');
            if (!expected) {
                throw new Error('Missing signature on incoming request');
            }
            const calculated = getSignature(buf, this.secret);
            debug('verifySignature:', expected, calculated);
            if (expected !== calculated) {
                //debug('Invalid X-Hub-Signature:', "Content:", "-" + buf.toString('utf8') + "-");
                //throw new Error('Invalid signature on incoming request');
                this.emit('error', { message: 'Invalid signature on incoming request' });
            } else {
                debug('Valid signature! Encoding:', encoding);
            }
        };

        napp.use(bodyParser.urlencoded({
            extended: true
        }));
        napp.use(npath, bodyParser.json(this.secret ? {
            verify: verifyRequest //.bind(this)
        } : {}));

        /**
           Setups verify middleware just for post route on our
           receive webhook, and catch any errors it might throw to
           prevent the request from being parsed further.
        */
        //napp.post(npath, bodyParser.json({ verify: verifyRequest }));

        /**
           Keep alive Ping pong endpoint
         */
        napp.get(path.join(npath, 'ping'), (req, res) => {
            res.status(200).json({ pong: `${new Date().getTime()}` });
        });

        /**
           Set up Chatshipper Webhook GET Verification Endpoint
         */
        napp.get(npath, (req, res) => {
            if (req.query.type === 'subscribe' && req.query.challenge) {
                debug('Token validation successful.');
                res.status(200).send(req.query.challenge);
            } else {
                //debug('Token validation failed. Make sure the validation tokens match.');
                this.emit('error', { message: 'Invalid GET request' });
                res.status(403).end();
            }
        });

        /**
           Express error-handling middleware function.
           Read more: http://expressjs.com/en/guide/error-handling.html
        */
        function abortOnValidationError(err, req, res, next) {
            if (err) {
                //debug(`** Invalid X-HUB signature on incoming request! ${err.toString()}`);
                this.emit('error', { message: `Invalid X-HUB signature on incoming request: ${err.toString()}` });
                res.status(401).send({ error: 'Invalid signature.' });
            } else {
                next();
            }
        }

        /**
           Add an error-handling Express middleware function
           to prevent returning sensitive information.
        */
        napp.use(abortOnValidationError);

        /**
           Setups the prefix handler for Chatshipper webhook calls
           @param {webhookCallback} handler
        */
        const nhandler = opts.handler || (async (req, res) => {
            try {
                if (opts.async) {
                    debug('router: async ingest');
                    this.ingest(req.body, null, opts).then((done) => {
                        debug('router: async ingest done, sending 200 ok', done);
                        res.status(200).end();
                    }).catch(e => {
                        debug('router: async ingest got error, still sending 200 ok', e);
                        // to be discussed
                        res.status(200).end();
                    });
                } else {
                    res.status(200).end();
                    this.ingest(req.body, null, opts);
                }
            } catch (e) {
                //debug('err', e);
                this.emit('error', e);
            }
        });
        napp.post(npath, nhandler);

        return napp;
    }

    /**
     * Closes the express server (calls `.close()` on the server instance).
     * @name ChipChat#close
     * @function
     */
    close() {
        this.server.close();
    }
};

module.exports = Server;
