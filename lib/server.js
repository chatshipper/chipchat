const express    = require('express');
const bodyParser = require('body-parser');
const http       = require('http');
const crypto     = require('crypto');
const debug      = require('debug')('chipchat:server');
const url        = require('url');

const { Router } = express;

/**
   Calculate the X-Hub-Signature header value.
   @param {buffer} buff - Crypto usable buffer for signature generation
   @param {string} key - Hmac compatible key for signature
*/
function getSignature(buf, key) {
    const hmac = crypto.createHmac('sha1', key);
    hmac.update(buf, 'utf-8');
    return `sha1=${hmac.digest('hex')}`;
}

const Server = Webhooks => class extends Webhooks {
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
     * Starts the express server on the specified port. Defaults port to 3000.
     * @param {Number} [port=3000]
     */
    start(port) {
        this.app = express();
        this.app.set('port', port || process.env.PORT || 4002);
        this.expressRoutes(this.app, this.webhook, this.secret);

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
        this.server.listen(this.app.get('port'), () => {
            console.log(`ChipChat Webhook running on localhost:${this.server.address().port}${this.webhook}`);
        });
    }

    expressRoutes(app, path, secret, handler) {
        const npath = path && path.charAt(0) !== '/' ? `/${path}` : (path || '/');
        const napp = app || Router();

        napp.post('/webhooks/smooch', bodyParser.json(), this._smoochProxy);

        /**
            Verifies the SHA1 signature of the raw request payload before bodyParser parses it
            Will abort parsing if signature is invalid, and pass a generic error to response
            Read more: https://github.com/expressjs/body-parser#verify
        */
        function verifyRequest(req, res, buf, encoding) {
            const expected = req.get('x-hub-signature');
            if (!expected) {
                //console.log('reqbody', req.body);
                throw new Error('Missing signature on incoming request');
            }
            const calculated = getSignature(buf, secret);
            if (expected !== calculated) {
                debug('Invalid X-Hub-Signature:', expected); //, "Content:", "-" + buf.toString('utf8') + "-");
                throw new Error('Invalid signature on incoming request');
            }
            debug('Valid signature! Encoding:', encoding);
        }

        napp.use(bodyParser.urlencoded({
            extended: true
        }));
        napp.use(npath, bodyParser.json(secret ? {
            //verify: this._verifyRequestSignature.bind(this)
            verify: verifyRequest.bind(this)
        } : {}));

        /**
           Setups verify middleware just for post route on our
           receive webhook, and catch any errors it might throw to
           prevent the request from being parsed further.
        */
        //napp.post(npath, bodyParser.json({ verify: verifyRequest }));


        /**
           Set up Chatshipper Webhook GET Verification Endpoint
         */
        napp.get(npath, (req, res) => {
            if (req.query.type === 'subscribe' && req.query.challenge) {
                debug('Token validation successful.');
                res.status(200).send(req.query.challenge);
            } else {
                console.error('Token validation failed. Make sure the validation tokens match.');
                res.status(403).end();
            }
        });

        /**
           Express error-handling middleware function.
           Read more: http://expressjs.com/en/guide/error-handling.html
        */
        function abortOnValidationError(err, req, res, next) {
            if (err) {
                debug(`** Invalid X-HUB signature on incoming request! ${err.toString()}`);
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
        const nhandler = handler || ((req, res) => {
            const data = req.body;
            if (data.object !== 'page') {
                //return;
            }
            debug('procpost', data.event);
            res.status(200).end();
            try {
                this.ingest(req.body);
            } catch (e) {
                debug('err', e);
                this.emit('error', e);
            }
        });
        napp.post(npath, nhandler);

        return napp;
    }

    /**
    * Closes the express server (calls `.close()` on the server instance).
    */
    close() {
        this.server.close();
    }
};

module.exports = Server;
