
## Getting Started

- Install ChipChat via NPM, create a new `index.js`, require ChipChat and create a new bot instance using your ChatShipper API token, refresh token and webhook secret.

**Note:** If you don't know how to get these tokens, take a look at the ChatShipper [Developer Hub](https://developers.chatshipper.com/quickstart/createbotjs/#before-you-start)

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

Admin-scoped access token have an expiration date set. To have ChipChat automatically refresh the access token when it is expired, provide your bot's `refresh token` and `email`:
```javascript
const bot = new ChipChat({
  token: process.env.TOKEN,
  refreshToken: process.env.REFRESH_TOKEN,
  email: 'bot+6l5V87eY3@chatshipper.com'
});
```
This will, when any request results in a "JWT expired" error, set a new access token on the instance, and retry the request. Subscribe to the `token` event to further process newly created access tokens.

- Subscribe to messages sent by the user with the `bot.on()` and `bot.onText` methods, and reply using the `conversation` object:
```javascript
bot.on('message', (message, conversation) => {
  const text = message.text;
  conversation.say(`You said: ${text}`).then(() => {
    conversation.say('How are you today?');
  });
});
bot.onText(['hello', 'hi', /hey( there)?/i], (message, conversation) => {
  conversation.say('You said "hello", "hi", "hey", or "hey there"');
});

bot.onText(['help'], (message, conversation) => {
  // Send a text message with buttons
  conversation.say({
    text: 'What do you need help with?',
    actions: [
      { type: 'postback', text: 'Settings', payload: 'HELP_SETTINGS' },
      { type: 'postback', text: 'FAQ', payload: 'HELP_FAQ' },
      { type: 'postback', text: 'Talk to a human', payload: 'HELP_HUMAN' }
    ]
  });
});

bot.onText('image', (message, conversation) => {
  // Send an attachment
  conversation.say({
    contentType: 'image/png',
    text: 'http://example.com/image.png'
  });
});
```

- Start a conversation and keep the user's answers in the `conversation context`:

```javascript
bot.on('message', (message, conversation) => {
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

    askName(conversation);
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
