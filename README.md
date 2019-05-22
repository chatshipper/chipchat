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

// Create a new bot instance
const bot = new ChipChat({
    token: process.env.TOKEN
});

// Use any REST resource
bot.users.get(bot.auth.user).then((botUser) => {
    console.log(`Hello ${botUser.name}`);
});

// Listen to some resource events
bot.on('user.login', (payload) => {
    console.log(payload.activity.summary);
});
bot.on('organization.create', (payload) => {
    console.log('Organization created', payload.activity.summary);
});

// Accept all channel notifications
bot.on('notify', (msg, ctx) => ctx.accept());

// Echo all messages as text
bot.on('message', (msg, ctx) => ctx.say(`Echo: ${msg.text}`));

// Subscribe using wildcards, respond to consumer
bot.on('message.*.contact.*', (msg, ctx) => {
    ctx.say({ text: '👍', role: 'agent' });
});

// Listen to utterances
bot.onText(['hi', /hello/], (ctx) => ctx.reply('Hey there'));

// Start Express.js webhook server to start listening
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

**Important**: Be sure to login once, and re-use the same token in all your subsequent requests to the API. Do not generate new tokens from your code for every new request to the API.

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

- Subscribe to messages sent by the user with the `bot.on()` and `bot.onText` methods, and reply using the `chat` object:
```javascript
bot.on('message', (message, chat) => {
  const text = message.text;
  chat.say(`You said: ${text}`).then(() => {
    chat.say('How are you today?');
  });
});
bot.onText(['hello', 'hi', /hey( there)?/i], (payload, chat) => {
  chat.say('You said "hello", "hi", "hey", or "hey there"');
});

bot.onText(['help'], (message, chat) => {
  // Send a text message with buttons
  chat.say({
    text: 'What do you need help with?',
    actions: [
      { type: 'postback', text: 'Settings', payload: 'HELP_SETTINGS' },
      { type: 'postback', text: 'FAQ', payload: 'HELP_FAQ' },
      { type: 'postback', text: 'Talk to a human', payload: 'HELP_HUMAN' }
    ]
  });
});

bot.onText('image', (message, chat) => {
  // Send an attachment
  chat.say({
    contentType: 'image/png',
    text: 'http://example.com/image.png'
  });
});
```

- Start a conversation and keep the user's answers in `context`:

```javascript
bot.on('message', (payload, chat) => {
    const sendSummary = (ctx) => {
        ctx.say(`Ok, here's what you told me about you:
            - Name: ${ctx.get('name')}
            - Favorite Food: ${ctx.get('food')}`);
        ctx.leave();
    };

    const askFavoriteFood = (conv) => {
        conv.ask("What's your favorite food?", (msg, ctx) => {
            const text = msg.text;
            ctx.set('food', text);
            ctx.ask(`So your favorite food is ${text}?`, () => sendSummary(ctx));
        });
    };

    const askName = (conv) => {
        conv.ask("What's your name?", (msg, ctx) => {
            const text = msg.text;
            ctx.set('name', text);
            ctx.say(`Oh, your name is ${text}`, () => askFavoriteFood(ctx));
        });
    };

    askName(chat);
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
> ChipChat Webhook running on localhost:4002
```

- If you want to test your bot locally, install a localhost tunnel like [ngrok](https://ngrok.com/) and run it on your bot's port:

```
$ ngrok http 4002
```

Then use the provided HTTPS URL (for example `https://99b8d4c2.ngrok.io`) to configure your webhook in the ChatShipper admin UI.

## API Resources

All organization resources available through the API can be accessed by the SDK: `users`, `channels`, `contacts`, `conversations`, `messages`, `organizations`, `orggroups`, `services`, `forms`, `workflows`, `kbases`, `kbitems`, `articles` and `files`.

Each resource has the methods `list`,`get`,`create`,`update` and `delete` available to it.

<a name="list"></a>

## bot.&lt;resources&gt;.list(options, [callback])
Search a resource collection.

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | Query options |
| callback | <code>function</code> | Callback |

<a name="get"></a>

## bot.&lt;resources&gt;.get(id, [options], [callback])
Get a specific resource.

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | Resource ID |
| options | <code>object</code> | Optional selection and population options |
| callback | <code>function</code> | Optional Callback |

<a name="create"></a>

## bot.&lt;resources&gt;.create(options, [callback])
Create a new resource.

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | New resource properties |
| callback | <code>function</code> | Callback |

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

<a name="update"></a>

## bot.&lt;resources&gt;.update(options, [callback])
Update a resource.

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | Updated resource properties |
| callback | <code>function</code> | Callback |

<a name="delete"></a>

## bot.&lt;resources&gt;.delete(id, [callback])
Delete a resource.

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | Resource ID |
| callback | <code>function</code> | Callback |


### Using Promises

Every method returns a chainable promise which can be used instead of a regular callback:

```javascript
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

You can subscribe to any webhook callback events received by the webhook with the `bot.on()` method. See our [https://developers.chatshipper.com/docs/pg-webhooks#section-8-2-webhook-events](webhooks guide) for a full list of possible events.

#### Receive API

Use these methods to subscribe your bot to messages, attachments or anything the user might send.

### `.on(event, callback)`

| Param | Type | Default | Required |
|:------|:-----|:--------|:---------|
| `event` | string | | `Y` |
| `callback` | function | | `Y` |

Subscribe to an event emitted by the bot, and execute a callback when those events are emitted. Available events are:

| Event | Description |
|:------|:-----|
| `ready` | The webhook server is listening |
| `message` | The bot received a text message |
| `notify` | The bot was addressed directly |
| `<resource>.<action>` | Eg. `organization.update` |
| `activity` | Any activity occurred |
| `error` | An error occurred |

If you want to subscribe to specific keywords on a `message` event, see the `.onText()` method below.

#### Ready Event
The `ready` event is fired after completion of the `bot.start()` webhook setup.
```javascript
bot.on('ready', (msg, ctx) => {
  const text = payload.message.text;
  console.log(`The user said: ${text}`);
});
bot.start();
```
#### Messaging Events

_Message creation_ events are triggered with a Message and Context (the augmented conversation) as arguments.

```javascript
bot.on('message', (payload, chat) => {
  const text = payload.message.text;
  console.log(`The user said: ${text} in ${ctx.name}`);
});
```
The specified callback will be invoked with 3 params: `(payload, chat, data)`

| Param | Description |
|:------|:-----|
| `payload` | The data sent by the user (contains the text of the message, the attachment, etc.) |
| `chat` | A `Chat` instance that you can use to reply to the user. Contains all the methods defined in the [Send API](#send-api) |
| `data` | Contains extra data provided by the framework, like a `captured` flag that signals if this message was already captured by a different callback |

Full message creation events are named after  the _conversation type_ and _message type_ that triggered it:
    message.create.<conversation.type>.<message.type>

Possible _conversation types_ are **contact**, **bot**, **agent** and **system**.

In addition, ChipChat fires a generic `message` event, and for any message type that has a `role` specified (chat, card, mention and postback), the full event with the role attached.

As an example, the webhook event type `message.create.contact.mention` would trigger the following events:
- message
- message.create.contact.mention
- message.create.contact.mention.agent

Example:
```javascript
bot.on('message.create.contact.chat', (msg, ctx) => {
  // Reply into the conversation
  chat.say('Hey, user. I got your message!');
});
```
#### Notify Events

A `notify` event is triggered every time your bot gets:
- mentioned in a conversation;
- assigned a conversation in its inbox;
- receives a bot command.

Like message creation events, the callback takes a Message and a Context as its arguments.

```javascript
bot.on('notify', (msg, ctx) => {
  ctx.say('Wazzup?');
});
```
**Note**: this should not be confused with the `channel.notify` event, which gets triggered on every agent channel notification.

#### Other Resource Events

All other resources trigger webhooks on resource creation, updates and deletion - such as the `service.create` event when a new service is created, or the `article.update` event whenever an article is updated. The webhook payload contains the corresponding resource objects; `data.service` and `data.article` in our examples.

```javascript
bot.on('user.login', (payload) => {});
bot.on('service.error', (payload) => {});
bot.on('conversation.update', (payload) => {});
```
See our [webhooks guide](https://developers.chatshipper.com/docs/pg-webhooks#section-8-2-webhook-events) for a full list of events.

#### Activity Events

Every webhook event comes with an `Activity` object modeled after ActivityStreams, which get emitted in itself as `activity` events:
```javascript
bot.on('activity', (activity) => {
  console.log(activity.summary);
});
```
#### Error handling

By default ChipChat will print all errors to stderr and rethrow the error. To perform custom error-handling logic, just subscribe to the `error` event:
```
bot.on('error', (err) => {
  console.log('Ooops', err)
})
```

### Event wildcards

An event name passed to the `bot.on()` listener can contain a wild card (the
`*` character).
```javascript
bot.on('user.*', (payload) => {}); // all user events
bot.on('*.update', (payload) => {}); // all resource update events

bot.on('message.create.contact.*', (msg, ctx) {
  // process any message in contact conversations
});
```
Message creation event names may use more than one wildcard. A double wildcard (the string `**`) matches any number of levels (zero or more) of events.

The following handlers are all triggered for an occurence of a `message.create.contact.postback` event (a consumer clicking a button):
```javascript
bot.on('message', (msg, ctx) => {});
bot.on('message.**', (msg, ctx) => {});
bot.on('**.postback', (msg, ctx) => {});
bot.on('**.postback.contact', (msg, ctx) => {});
bot.on('message.create.*.postback', (msg, ctx) => {});
bot.on('message.create.*.postback.*', (msg, ctx) => {});
```


### `.onText(keywords, callback)`

| Param | Type | Default | Required |
|:------|:-----|:--------|:---------|
| `keywords` | string, regex or mixed array | | `Y` |
| `callback` | function | | `Y` |

A convinient method to subscribe to `message` events containing specific keywords. The `keyword` param can be a string, a regex or an array of both strings and regexs that will be tested against the received message. If the bot receives a message that matches any of the keywords, it will execute the specified `callback`. String keywords are case-insensitive, but regular expressions are not case-insensitive by default, if you want them to be, specify the `i` flag.

The callback's signature is identical to that of the `.on()` method above.

#### `.onText()` examples:

```javascript
bot.onText('hello', (payload, chat) => {
  chat.say('Hello, human!');
});

bot.onText(['hello', 'hi', 'hey'], (payload, chat) => {
  chat.say('Hello, human!');
});

bot.onText([/(good)?bye/i, /see (ya|you)/i, 'adios'], (payload, chat) => {
  // Matches: goodbye, bye, see ya, see you, adios
  chat.say('Bye, human!');
});
```

**Note** that if a bot is subscribed to both the `message` event using the `.on()` method and a specific keyword using the `.onText()` method, the event will be emitted to both of those subscriptions. If you want to know if a message event was already captured by a different subsciption, you can check for the `data.captured` flag on the callback.


## Ingesting Events

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
Use `chipchat.router()` to integrate ChipChat into your Express app:
```
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json({
    //allow signature verification based on the app secret
    verify: chipchat.getVerifySignature(process.env.APP_SECRET)
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/webhook", chipchat.router());
app.listen(3000);
```


### Raw Ingest

Use `bot.ingest(payload)` to process the raw webhook payload. Here's an example **Google Cloud Function**:

```javascript
const bot = new ChipChat({
    token: process.env.TOKEN
});
module.exports = (event, callback) => {
    const pubsubMessage = event.data;
    const dataStr = pubsubMessage.data ? Buffer.from(pubsubMessage.data, 'base64').toString() : '{}';

    // On any errors below, we'll call the callback without
    // error propagation, as otherwise the event will be retried
    let payload;
    try {
        payload = JSON.parse(dataStr);
    } catch (err) {
        logger.error(`Error while parsing data: ${err}`);
        return callback();
    }

    if (!payload.event || !payload.callback) {
        logger.error('Invalid payload, missing %s', !payload.callback ? 'callback' : 'event');
        return callback();
    }

    // ingest the payload in your bot
    bot.ingest(payload);

    return callback();
};
```


## Extending ChipChat

### Mixins

Use the `ChipChat.mixin()` class method to augment bot instances with your own functions.

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

Take a look at the `examples/modules.js` file for a complete example.

### Middleware

Middlewares are functions that perform tasks before and after an operation (that call an API endpoint).

They can be used to modify parameters given to the operation, modify data received by the API, stop an operation call, cache data on the fly, batch requests, etc.

#### `constructor`

On instantiation:

```javascript
const bot = new ChipChat({
    token: process.env.TOKEN,
    middleware: {
        send: [function (bot, message, next) {
            if (message.text) {
                message.text = `Middleware message mangling: ${message.text}`
            }
            next();
        }],
        receive: function (bot, payload, next) {
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
