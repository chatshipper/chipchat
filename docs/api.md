<a name="module_ChipChat"></a>

## ChipChat
ChipChat - ChatShipper SDK Main module

**Author**: Chatshipper  

* [ChipChat](#module_ChipChat)
    * [~ChipChat](#module_ChipChat..ChipChat) ⇐ <code>RestAPI</code>
        * [new ChipChat(options, |{array}, |{array})](#new_module_ChipChat..ChipChat_new)
        * _instance_
            * [.token](#module_ChipChat..ChipChat+token)
            * [.secret](#module_ChipChat..ChipChat+secret)
            * [.host](#module_ChipChat..ChipChat+host)
            * [.use(middleware)](#module_ChipChat..ChipChat+use) ⇒
            * [.module(factory, options)](#module_ChipChat..ChipChat+module) ⇒
            * [.registerCallback(name, callback)](#module_ChipChat..ChipChat+registerCallback)
            * [.on(event, [conditionals], handler)](#module_ChipChat..ChipChat+on)
            * [.onText(regexp, callback)](#module_ChipChat..ChipChat+onText)
            * [.removeTextListener(regexp)](#module_ChipChat..ChipChat+removeTextListener) ⇒ <code>Object</code>
            * [.addReplyListener(chatId, messageId, callback)](#module_ChipChat..ChipChat+addReplyListener) ⇒ <code>Number</code>
            * [.removeReplyListener(replyListenerId)](#module_ChipChat..ChipChat+removeReplyListener) ⇒ <code>Object</code>
            * [.ingest(payload, [signature])](#module_ChipChat..ChipChat+ingest)
            * [.conversation(connversationId, callback)](#module_ChipChat..ChipChat+conversation) ⇒ <code>Promise</code>
        * _static_
            * [.mixin(methods)](#module_ChipChat..ChipChat.mixin)
    * [~ignoreSelfMiddleware()](#module_ChipChat..ignoreSelfMiddleware)
    * [~ignoreBotsMiddleware()](#module_ChipChat..ignoreBotsMiddleware)
    * [~ignoreUnjoinedMiddleware()](#module_ChipChat..ignoreUnjoinedMiddleware)

<a name="module_ChipChat..ChipChat"></a>

### ChipChat~ChipChat ⇐ <code>RestAPI</code>
Create a new ChipChat bot

**Kind**: inner class of [<code>ChipChat</code>](#module_ChipChat)  
**Extends**: <code>RestAPI</code>, <code>Server</code>, <code>EventEmitter</code>  
**Mixes**: <code>RestAPI</code>, <code>Server</code>, <code>EventEmitter</code>  

* [~ChipChat](#module_ChipChat..ChipChat) ⇐ <code>RestAPI</code>
    * [new ChipChat(options, |{array}, |{array})](#new_module_ChipChat..ChipChat_new)
    * _instance_
        * [.token](#module_ChipChat..ChipChat+token)
        * [.secret](#module_ChipChat..ChipChat+secret)
        * [.host](#module_ChipChat..ChipChat+host)
        * [.use(middleware)](#module_ChipChat..ChipChat+use) ⇒
        * [.module(factory, options)](#module_ChipChat..ChipChat+module) ⇒
        * [.registerCallback(name, callback)](#module_ChipChat..ChipChat+registerCallback)
        * [.on(event, [conditionals], handler)](#module_ChipChat..ChipChat+on)
        * [.onText(regexp, callback)](#module_ChipChat..ChipChat+onText)
        * [.removeTextListener(regexp)](#module_ChipChat..ChipChat+removeTextListener) ⇒ <code>Object</code>
        * [.addReplyListener(chatId, messageId, callback)](#module_ChipChat..ChipChat+addReplyListener) ⇒ <code>Number</code>
        * [.removeReplyListener(replyListenerId)](#module_ChipChat..ChipChat+removeReplyListener) ⇒ <code>Object</code>
        * [.ingest(payload, [signature])](#module_ChipChat..ChipChat+ingest)
        * [.conversation(connversationId, callback)](#module_ChipChat..ChipChat+conversation) ⇒ <code>Promise</code>
    * _static_
        * [.mixin(methods)](#module_ChipChat..ChipChat.mixin)

<a name="new_module_ChipChat..ChipChat_new"></a>

#### new ChipChat(options, |{array}, |{array})
Create a new ChipChat instance


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  | Constructor Options |
| [options.token] | <code>string</code> |  | Chatshipper API Access Token |
| [options.refreshToken] | <code>string</code> |  | Chatshipper API Refresh Token |
| [options.email] | <code>string</code> |  | Primary email of the bot user. Used as clientId to renew          access tokens (based on the refresh token). |
| [options.secret] | <code>string</code> |  | Chatshipper webhook Secret |
| [options.host] | <code>string</code> |  | Target Chatshipper API server, defaults to https://api.chatshipper.com |
| [options.webhook] | <code>string</code> |  | Webhook path segment, defaults to '/'. Only used by          the 'start' method. |
| [options.ignoreSelf] | <code>boolean</code> | <code>true</code> | ignore any messages from yourself. |
| [options.ignoreBots] | <code>boolean</code> | <code>true</code> | ignore any messages from other bot users. |
| [options.ignoreUnjoined] | <code>boolean</code> | <code>false</code> | ignore any messages in conversations that          the bot hasn't joined. |
| [options.preloadOrganizations] | <code>boolean</code> | <code>false</code> | prefetch organization record for          each conversation |
| [options.onlyFirstMatch] | <code>boolean</code> | <code>false</code> | Set to true to stop after first match.          Otherwise, all regexps are executed. |
| [options.middleware] | <code>string</code> |  | Middleware stack functions |
| |{array} | <code>function</code> |  | options.middleware.send - A function or a list of functions for the          outbound pipeline |
| |{array} | <code>function</code> |  | options.middleware.receive - A function or a list of functions for          the inbound pipeline |

<a name="module_ChipChat..ChipChat+token"></a>

#### chipChat.token
**Kind**: instance property of [<code>ChipChat</code>](#module_ChipChat..ChipChat)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| token | <code>string</code> | The API bearer token. |

<a name="module_ChipChat..ChipChat+secret"></a>

#### chipChat.secret
**Kind**: instance property of [<code>ChipChat</code>](#module_ChipChat..ChipChat)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| secret | <code>string</code> | The webhook payload verification secret. |

<a name="module_ChipChat..ChipChat+host"></a>

#### chipChat.host
**Kind**: instance property of [<code>ChipChat</code>](#module_ChipChat..ChipChat)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| host | <code>string</code> | The API host. |

<a name="module_ChipChat..ChipChat+use"></a>

#### chipChat.use(middleware) ⇒
Apply `receive` middleware on all incoming message webhooks.

**Kind**: instance method of [<code>ChipChat</code>](#module_ChipChat..ChipChat)  
**Returns**: instance  

| Param | Type | Description |
| --- | --- | --- |
| middleware | <code>function</code> \| <code>array</code> | function(s) |

<a name="module_ChipChat..ChipChat+module"></a>

#### chipChat.module(factory, options) ⇒
Enable a module for the bot instance. Modules are simply functions
that you can use to organize your code in different files and folders.

**Kind**: instance method of [<code>ChipChat</code>](#module_ChipChat..ChipChat)  
**Returns**: Function  

| Param | Type | Description |
| --- | --- | --- |
| factory | <code>function</code> | Called immediately and receives the bot instance and (optional) options as its parameters. |
| options | <code>Object</code> | Optional object to pass options to the module |

<a name="module_ChipChat..ChipChat+registerCallback"></a>

#### chipChat.registerCallback(name, callback)
Register a callback by name, to have it referenced later by name-based callback
(eg on ask())

**Kind**: instance method of [<code>ChipChat</code>](#module_ChipChat..ChipChat)  

| Param | Type |
| --- | --- |
| name | <code>String</code> | 
| callback | <code>function</code> | 

<a name="module_ChipChat..ChipChat+on"></a>

#### chipChat.on(event, [conditionals], handler)
Listen for [ChatShipper webhooks](https://developers.chatshipper.com/docs/pg-webhooks/),
which are fired for almost every significant action that users take on
ChatShipper. This registers a handler function to be called whenever this event is fired.

**Kind**: instance method of [<code>ChipChat</code>](#module_ChipChat..ChipChat)  

| Param | Type | Description |
| --- | --- | --- |
| event | <code>string</code> \| <code>array</code> | the name of the [ChatShipper webhook event](https://developers.chatshipper.com/docs/pg-webhooks/#section-8-2-webhook-events). |
| [conditionals] | <code>object</code> | Matching conditions key-value pairs |
| handler | <code>function</code> | The handler to call. |

<a name="module_ChipChat..ChipChat+onText"></a>

#### chipChat.onText(regexp, callback)
Register a RegExp to test against an incomming text message.

**Kind**: instance method of [<code>ChipChat</code>](#module_ChipChat..ChipChat)  

| Param | Type | Description |
| --- | --- | --- |
| regexp | <code>RegExp</code> | RegExp to be executed with `exec`. |
| callback | <code>function</code> | Callback will be called with 2 parameters, the `msg` and the result of executing `regexp.exec` on message text. |

<a name="module_ChipChat..ChipChat+removeTextListener"></a>

#### chipChat.removeTextListener(regexp) ⇒ <code>Object</code>
Remove a listener registered with `onText()`.

**Kind**: instance method of [<code>ChipChat</code>](#module_ChipChat..ChipChat)  
**Returns**: <code>Object</code> - deletedListener The removed reply listener if
  found. This object has `regexp` and `callback`
  properties. If not found, returns `null`.  

| Param | Type | Description |
| --- | --- | --- |
| regexp | <code>RegExp</code> | RegExp used previously in `onText()` |

<a name="module_ChipChat..ChipChat+addReplyListener"></a>

#### chipChat.addReplyListener(chatId, messageId, callback) ⇒ <code>Number</code>
Register a reply to wait for a message response.

**Kind**: instance method of [<code>ChipChat</code>](#module_ChipChat..ChipChat)  
**Returns**: <code>Number</code> - id                    The ID of the inserted reply listener.  

| Param | Type | Description |
| --- | --- | --- |
| chatId | <code>Number</code> \| <code>String</code> | The chat id where the message cames from. |
| messageId | <code>Number</code> \| <code>String</code> | The message id to be replied. |
| callback | <code>function</code> | Callback will be called with the reply  message. |

<a name="module_ChipChat..ChipChat+removeReplyListener"></a>

#### chipChat.removeReplyListener(replyListenerId) ⇒ <code>Object</code>
Removes a reply that has been prev. registered for a message response.

**Kind**: instance method of [<code>ChipChat</code>](#module_ChipChat..ChipChat)  
**Returns**: <code>Object</code> - deletedListener      The removed reply listener if
  found. This object has `id`, `chatId`, `messageId` and `callback`
  properties. If not found, returns `null`.  

| Param | Type | Description |
| --- | --- | --- |
| replyListenerId | <code>Number</code> | The ID of the reply listener. |

<a name="module_ChipChat..ChipChat+ingest"></a>

#### chipChat.ingest(payload, [signature])
Ingest raw webhook data

**Kind**: instance method of [<code>ChipChat</code>](#module_ChipChat..ChipChat)  

| Param | Type | Description |
| --- | --- | --- |
| payload | <code>Object</code> | the full webhook payload |
| [signature] | <code>String</code> | x-hub-signature http header, a HMAC to verify the payload |

<a name="module_ChipChat..ChipChat+conversation"></a>

#### chipChat.conversation(connversationId, callback) ⇒ <code>Promise</code>
Load a conversation object, augmented with context methods

**Kind**: instance method of [<code>ChipChat</code>](#module_ChipChat..ChipChat)  

| Param | Type | Description |
| --- | --- | --- |
| connversationId | <code>String</code> \| <code>Object</code> | or connversation |
| callback | <code>function</code> |  |

<a name="module_ChipChat..ChipChat.mixin"></a>

#### ChipChat.mixin(methods)
Attach new methods to the ChipChat class

**Kind**: static method of [<code>ChipChat</code>](#module_ChipChat..ChipChat)  

| Param | Type |
| --- | --- |
| methods | <code>array</code> | 

**Example**  
````
ChipChat.mixin({
    foo: c => c.say('Okidoki')
});
const bot = new ChipChat({
    token: process.env.TOKEN
});
bot.on('message', (m, c) => bot.foo(c));
````
<a name="module_ChipChat..ignoreSelfMiddleware"></a>

### ChipChat~ignoreSelfMiddleware()
Middleware that ignores messages from this bot user (self).

**Kind**: inner method of [<code>ChipChat</code>](#module_ChipChat)  
**Api**: private  
<a name="module_ChipChat..ignoreBotsMiddleware"></a>

### ChipChat~ignoreBotsMiddleware()
Middleware that ignores messages from any bot user

**Kind**: inner method of [<code>ChipChat</code>](#module_ChipChat)  
**Api**: private  
<a name="module_ChipChat..ignoreUnjoinedMiddleware"></a>

### ChipChat~ignoreUnjoinedMiddleware()
Middleware that ignores messages in unjoined conversations

**Kind**: inner method of [<code>ChipChat</code>](#module_ChipChat)  
**Api**: private  
## Functions

<dl>
<dt><a href="#httpMiddleware">httpMiddleware()</a> ⇒ <code>function</code></dt>
<dd><p>Provides http/https middleware as the
<a href="https://nodejs.org/api/http.html#http_http_createserver_options_requestlistener">requestlistener</a>
option to createServer.</p>
</dd>
<dt><a href="#start">start([port])</a></dt>
<dd><p>Starts the <a href="http://expressjs.com">express</a> server on the specified port. Defaults port to 3000.</p>
</dd>
<dt><a href="#router">router(pathPrefix, app)</a> ⇒</dt>
<dd><p>Get an <a href="http://expressjs.com">express</a> router that can be used to
expose HTTP endpoints</p>
<pre><code>module.exports = bot =&gt; {
  // Get an express router to expose new HTTP endpoints
  const routes = bot.router(&#39;/my-webhook&#39;);

  // Use any middleware
  routes.use(require(&#39;express&#39;).static(__dirname + &#39;/public&#39;));

  // Add a new route
  routes.get(&#39;/hello-world&#39;, (req, res) =&gt; {
    res.end(&#39;Hello World&#39;);
  });
};</code></pre>
<p>...or apply ChipChat routes in your own express app:</p>
<pre><code>const express = require(&#39;express&#39;);
const app = express();
bot.router(&#39;/my-webhook&#39;, app);
app.listen();</code></pre>
</dd>
</dl>

<a name="httpMiddleware"></a>

## httpMiddleware() ⇒ <code>function</code>
Provides http/https middleware as the
[requestlistener](https://nodejs.org/api/http.html#http_http_createserver_options_requestlistener)
option to createServer.

**Kind**: global function  
**Returns**: <code>function</code> - http middleware  
<a name="start"></a>

## start([port])
Starts the [express](http://expressjs.com) server on the specified port. Defaults port to 3000.

**Kind**: global function  

| Param | Type | Default |
| --- | --- | --- |
| [port] | <code>Number</code> | <code>3000</code> | 

<a name="router"></a>

## router(pathPrefix, app) ⇒
Get an [express](http://expressjs.com) router that can be used to
expose HTTP endpoints

```
module.exports = bot => {
  // Get an express router to expose new HTTP endpoints
  const routes = bot.router('/my-webhook');

  // Use any middleware
  routes.use(require('express').static(__dirname + '/public'));

  // Add a new route
  routes.get('/hello-world', (req, res) => {
    res.end('Hello World');
  });
};
```
...or apply ChipChat routes in your own express app:
```
const express = require('express');
const app = express();
bot.router('/my-webhook', app);
app.listen();
````

**Kind**: global function  
**Returns**: the provided app or a new [express.Router](http://expressjs.com/en/4x/api.html#router)  

| Param | Description |
| --- | --- |
| pathPrefix | the prefix for the routes |
| app | the Express app to attach the routes to |

<a name="module_chipchat/client"></a>

## chipchat/client
REST API Main module
   For the API reference see: https://developers.chatshipper.com

**Author**: Chatshipper  

* [chipchat/client](#module_chipchat/client)
    * _instance_
        * [.send(conversation, payload, cb)](#module_chipchat/client+send)
    * _inner_
        * [~RestAPI](#module_chipchat/client..RestAPI)
        * [~restCallback](#module_chipchat/client..restCallback) : <code>function</code>

<a name="module_chipchat/client+send"></a>

### chipchat/client.send(conversation, payload, cb)
Sends a message to the given conversation

**Kind**: instance method of [<code>chipchat/client</code>](#module_chipchat/client)  

| Param | Type | Description |
| --- | --- | --- |
| conversation | <code>string</code> | Target conversation |
| payload | <code>string</code> \| <code>object</code> | Message, |
| cb | <code>restCallback</code> | The callback that handles the response |

<a name="module_chipchat/client..RestAPI"></a>

### chipchat/client~RestAPI
This provides methods used for doing API requests. It's not meant to
be used directly.

**Kind**: inner mixin of [<code>chipchat/client</code>](#module_chipchat/client)  
<a name="module_chipchat/client..restCallback"></a>

### chipchat/client~restCallback : <code>function</code>
**Kind**: inner typedef of [<code>chipchat/client</code>](#module_chipchat/client)  

| Param | Type | Description |
| --- | --- | --- |
| null | <code>error</code> | on success, {string|object} on error |
| JSON | <code>document</code> | document response |

