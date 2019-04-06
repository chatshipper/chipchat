**ChipChat** is the ChatShipper Node.js SDK that helps you manage ChatShipper resources and build chat bots. This library provides convenient access to the ChatShipper API from applications written in server-side JavaScript.

## Documentation

See the [ChatShipper Developer Hub](https://developers.chatshipper.com/).

## Installation

Install the package with:
```
  $ npm install chipchat --save
```

## Usage

The package needs to be configured with your account's API token which is available in your [ChatShipper Dashboard][api-keys].

```javascript
'use strict';

const ChipChat = require('chipchat');

const bot = new ChipChat({
  token: process.env.TOKEN
});
bot.getUser().then(function(myProfile) {
  console.log("Hello " + myProfile.name);
});
bot.on('message', (msg, cnv) => {
  const text = msg.text;
  chat.say(`Echo: ${text}`);
});

bot.on('notify', (msg, ctx) => ctx.join());
bot.on('message', (msg, ctx) => ctx.reply('👍'));

bot.start();

```

## Features

- Full ChatShipper API v2 support
- Start **conversations**, **ask** questions and save important information in the **context** of the conversation.
- Organize your code in **modules** and **middleware**.
- Subscribe to **events**.
- http/https/express.js compatible webhooks
- Easy to extend


## Getting Started

- Install ChipChat via NPM, create a new `index.js`, require ChipChat and create a new bot instance using your ChatShipper API token, refresh token and webhook secret.

**Note:** If you don't know how to get these tokens, take a look at the ChatShipper [Developer Hub](https://developers.chatshipper.com/)

To use in your application, set your API token and an optional webhook secret in your environment, and instantiate the bot:

```javascript
// index.js
'use strict';
const ChipChat = require('chipchat');

const bot = new ChipChat({
  token: process.env.TOKEN
  secret: process.env.WEBHOOK_SECRET
});
```

- Subscribe to messages sent by the user with the `bot.on()` method, and reply using the `chat` object:
```javascript
bot.on('message', (payload, chat) => {
  const text = payload.message.text;
  console.log(`The user said: ${text}`);
  chat.say(`You said: ${text}`).then(() => {
    chat.say('How are you today?');
  });
});
```

- Call CRUD methods on any resource:
```javascript
bot.users.create(
  { name: 'John', email: 'johndoe@example.com' },
  (error, user) => {
    // User created
    }
);
```

- Set up webhooks and start the express server:
```javascript
bot.start();
```

- Start up your bot by running node:
```
$ node index.js
> BootBot running on port 3000
> Facebook Webhook running on localhost:3000/webhook
```

- If you want to test your bot locally, install a localhost tunnel like [ngrok](https://ngrok.com/) and run it on your bot's port:

```
$ ngrok http 3000
```

Then use the provided HTTPS URL to config your webhook on Facebook's Dashboard. For example if the URL provided by ngrok is `https://99b8d4c2.ngrok.io`, use `https://99b8d4c2.ngrok.io/webhook`.


## Authentication Token

To use the ChatShipper API, you first have to get a bot user account from the ChatShipper Admin UI. The Bot User details panel will give you a token, something like 123456789:AbCdfGhIJKlmNoQQRsTUVwxyZ.

Some resources require elevated (admin) rights. To create an admin-scope API token, you'll need to authenticate against the API. Generate your API token once using the following cURL request in your terminal (replace YOUR_ACCOUNT_EMAIL and YOUR_ACCOUNT_PASSWORD):
```
curl -H "Content-Type: application/json" -X POST -d '{"email":"YOUR_ACCOUNT_EMAIL","password":"YOUR_ACCOUNT_PASSWORD"}' https://api.chatshipper.com/v2/auth/token
```
If authentication succeeds, you will get a JSON response containing your authentication credentials: an access token and a refresh token. **Keep those 2 values private**, and store them safely for long-term use.

**Important**: Be sure to login once, and re-use the same token in all your subsequent requests to the API. Do not generate new tokens from your code for every new request to the API


## API Resources

All organization resources available through the API can be accessed by the SDK: 'User', 'UserGroup', 'Channel', 'Contact', 'Conversation', 'Message', 'Organization', 'OrganizationGroup', 'Service', 'Form', 'Workflow', 'Metric', 'Kbase', 'Kbitem', 'Article', 'Event', 'File' and 'Location'.

Each resource has the following methods available to it:

* get<Resource>s
* get<Resource>
* create<Resource>
* update<Resource>
* delete<Resource>

Example:

    chipchat.conversations.create(
      { name: 'Review'},
      (conversation) => {
            chipchat.say(conversation.id, 'Hello!');
            chipchat.sendMessage(conversation.id, {
                type: 'command',
                text: '/notify'
            });
        }
    );

### Using Promises

Every method returns a chainable promise which can be used instead of a regular callback:

```js
// Create a new customer and then a new charge for that customer:
chipchat.organizations.create({
    name: 'Acme',
    email: 'foo-customer@example.com'
}).then((organization) => {
    return chipchat.forms.create({
        organization: organization.id,
        name: 'Support Case'
        fields: [{ name: 'Case ID' }]
    });
}).then((form) => {
    return chipchat.conversations.create({
        organization: organization.id,
        messages: [{ type: 'form', meta: { form: form.id} }]
    });
}).then((conversation) => {
    // New conversation created with new service and form in a new organization
}).catch((err) => {
    // Deal with an error
});
```

## Receiving Events

ChatShipper platform events will typically come in through a configured **webhook**. To serve as a webhook callback processor, use one of the following:

### Built-in Express Server
The built-in Express.js server runs a webhook callback processor:

```javascript
const Bot = require('chipchat');

const bot = new Bot({
    token: process.env.TOKEN
});
bot.start();
```

### Http Middleware
For deployment as http/https middleware, use `bot.httpMiddleware()`
```
const http = require('http');
const Bot = require('chipchat');

const bot = new Bot({
    token: process.env.TOKEN
});

http.createServer(bot.httpMiddleware()).listen(3200);
console.log('Bot server running at port 3200.');
```
### Express Middleware
Use `chipchat.expressRouter()` to integrate ChipChat into your Express app:
```
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json({
    //allow signature verification based on the app secret
    verify: chipchat.getVerifySignature(process.env.APP_SECRET)
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/webhook", chipchat.expressRouter());
app.listen(3000);
```


### Raw Ingest

Use `bot.ingest(payload) to process the raw webhook payload. Here's an example **Google Cloud Function**:

```
module.exports = (event, callback) => {
    const pubsubMessage = event.data;
    const dataStr = pubsubMessage.data ? Buffer.from(pubsubMessage.data, 'base64').toString() : '{}';

    // On any errors below, we'll call the callback without
    // error propagation, as otherwise the event will be retried
    let payload;
    try {
        payload = JSON.parse(dataStr);
    } catch (err) {
        logger.error(`Webhook | Error while parsing ${dataStr}`, err);
        return callback();
    }

    if (!payload.event || !payload.callback) {
        logger.error('Webhook | Missing %s', !payload.callback ? 'callback' : 'event');
        return callback();
    }

    // ingest the payload in your bot
    bot.ingest(payload);

    return callback();
};
```

## Events

Subscribe to messages sent by the user with the `bot.on()` methods:

```javascript
bot.on('message', (payload, chat) => {
  const text = payload.message.text;
  console.log(`The user said: ${text}`);
});
```

### Event wildcards

```javascript
bot.on('message.create.*.chat', function (data) {
  console.log('message.create.*.chat', Object.keys(data).join(','));
});
```

## Extending

### Modules

Modules are simple functions that you can use to organize your code in different files and folders.

#### `.module(factory)`

The `factory` param is a function that gets called immediatly and receives the `bot` instance as its only parameter. For example:

```javascript
// help-module.js
module.exports = (bot) => {
  bot.hear('help', (payload, chat) => {
    // Send Help Menu to the user...
  });
};

// index.js
const helpModule = require('./help-module');
bot.module(helpModule);
```

Take a look at the `examples/module-example.js` file for a complete example.

#### `.mixin(methods)`

```javascript
'use strict';

const ChipChat = require('chipchat');
ChipChat.mixin({
    foo: c => c.say('Okidoki')
});
const bot = new ChipChat({
    token: process.env.TOKEN
});
bot.on('message').then((m,c) => bot.foo(c))
```

### Middleware

On instantiation:

```javascript
const bot = new Bot({
    token: process.env.TOKEN,
    host: process.env.APIHOST,
    middleware : {
        send  : [ function (bot, message, next) {
            if (message.text) {
                message.text = `Middleware message mangling: ${message.text}`
            }
            next();
        }],
        receive : function (bot, payload, next) {
            console.log(payload.text);
            next();
        }
    }
});
```

#### `.use()`

Use the bot.use() function to add inbound (receive) middleware

```javascript
bot.use((bot, payload, next) => {
    console.log(payload.text);
    payload.text = 'Mangled';
    next();
});
```

## Examples

For examples see the [examples](https://github.com/chatshipper/chipchat/tree/master/examples) folder. To try any of the examples:

### Configure environment:

    export APIHOST=https://api.chatshipper.com
    export TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6I...

Then, try any of the examples:

    cd examples
    node example.js


[api-keys]: https://dashboard.chatshipper.com/account/apikeys
