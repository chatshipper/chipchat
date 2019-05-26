**ChipChat** is the ChatShipper Node.js SDK that helps you manage ChatShipper resources and build chat bots. This library provides convenient access to the ChatShipper API from applications written in server-side JavaScript.

## Installation

Install the package with:
```
  $ npm install chipchat --save
```

## Usage

The package needs to be configured with your account's API token which is available in your [ChatShipper Dashboard](https://app.chatshipper.com/).

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

// Accept all bot notifications
bot.on('notify', (message, conversation) => conversation.accept());

// Echo all messages as text
bot.on('message', (message, conversation) => conversation.say(`Echo: ${message.text}`));

// Subscribe using wildcards, respond to consumer
bot.on('message.*.contact.*', (message, conversation) => {
    conversation.say({ text: '👍', role: 'agent' });
});

// Listen to utterances
bot.onText(['hi', /hello/], (_, conversation) => conversation.reply('Hey there'));

// Start Express.js webhook server to start listening
bot.start();

```

See [Quickstart](https://github.com/chatshipper/chipchat/tree/master/docs/quickstart.md) to get started.

## Features

- Full ChatShipper API v2 support
- Start **conversations**, **ask** questions and save important information in the **context** of the conversation.
- Organize your code in **modules** and **middleware**.
- Subscribe to **events**.
- http/https/express.js compatible webhooks
- Easy to extend

## API Resources

All organization resources available through the API can be accessed by the SDK: `users`, `channels`, `contacts`, `conversations`, `messages`, `organizations`, `orggroups`, `services`, `forms`, `workflows`, `kbases`, `kbitems`, `articles` and `files`.

Each resource has the methods `list`,`get`,`create`,`update` and `delete` available to it. See [REST API](https://github.com/chatshipper/chipchat/tree/master/docs/restapi.md) for more information.

## Receiving Events

You can subscribe to any webhook callback events received by the webhook with the `bot.on()` method. See our [webhooks guide](https://developers.chatshipper.com/docs/pg-webhooks#section-8-2-webhook-events) for a full list of possible events.

See [Events](https://github.com/chatshipper/chipchat/tree/master/docs/events.md) for more information on event subsriptions; read [Ingesting Events](https://github.com/chatshipper/chipchat/tree/master/docs/ingest.md) to see how to process payloads from webhooks and other sources.

## Sending Messages

A conversation context encapsulates all properties of a ChatShipper conversation, augmented with message sending methods.

See [Conversations](docs/conversation.md) for more information.

## Extending ChipChat

### Mixins

Mixins can be used to augment bot instances with your own functions.

### Modules

Modules are simple functions that you can use to organize your code in different files and folders.

### Middleware

Middlewares are functions that perform tasks before and after an operation (that call an API endpoint).

See [Extending](https://github.com/chatshipper/chipchat/tree/master/docs/extending.md) for more information.

## Examples

For examples see the [examples](https://github.com/chatshipper/chipchat/tree/master/examples) folder. To try any of the examples:

### Configure environment:

    export APIHOST=https://api.chatshipper.com
    export TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6I...

Then, try any of the examples:

    cd examples
    node example.js

## Documentation

See the [ChatShipper Developer Hub](https://developers.chatshipper.com/) for full platform documentation.
