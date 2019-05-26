## Ingesting Events

ChatShipper platform events will typically come in through a configured **webhook**. To serve as a webhook callback processor, use one of the following:

### Built-in Express Server

Use `bot.start()` to start the built-in Express.js server running a webhook callback processor:

```javascript
const Bot = require('chipchat');

const bot = new Bot({
    token: process.env.TOKEN
});

bot.start();
```
### Express Middleware

Use `bot.router()` to integrate ChipChat into your Express app:
```
const express = require("express");
const Bot = require('chipchat');

const bot = new Bot({
    token: process.env.TOKEN
});

const app = express();

app.use("/webhook", bot.router());

app.listen();
```

Alternatively, you can supply the path to the router
```
const app = express();
app.use(bot.router('/webhook'));
app.listen();
```
..or have the router attach itself to the app
```
const app = express();
bot.router('/webhook', app);
app.listen();
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
### Raw Ingest

Use `bot.ingest(payload)` to process the raw webhook payload. Here's an example **Google Cloud Function** listening on a pubsub topic:

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
        console.log(`Error while parsing data: ${err}`);
        return callback();
    }

    if (!payload.event || !payload.callback) {
        console.log('Invalid payload, missing %s', !payload.callback ? 'callback' : 'event');
        return callback();
    }

    // ingest the payload in your bot
    bot.ingest(payload);

    return callback();
};
```
