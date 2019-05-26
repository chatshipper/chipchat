## Conversations

A conversation context encapsulates all properties of a ChatShipper conversation, augmented with message sending methods. Conversations provide convenient ways to accept and leave conversations, send messages, ask questions and handle the user's answers. Conversations also provide methods to manage conversation state, so the interaction is always in context.

----

#### `bot.on('message', (_, conversation) => {})`

The conversation context object is provided as the second argument of `message` event handler callbacks:
```
bot.on('message', (message, conversation) => {
  // Reply into the conversation
  conversation.say('Hey, user. I got your message!');
});
```
See the [Events](events.md) documentation for more information.

----

#### `bot.conversation(conversationId, [callback])`

To create a conversation context from a conversation ID or a full conversation data structure, use the `bot.conversation()` method. Examples:

```
const convId = '5cd8c48dabd2dc52deb1cfb2';

// callback-based, from a conversation ID
bot.conversation(convId,
  (err, conversation) => conversation.say('Hello callback')
);

// promise-based, conversation context from a conversation ID
bot.conversation(convId).then(
  conversation => conversation.say('Hello promise')
);

// async/await, from a conversation ID
const asyncFunc1 = async () => {
  const convseration1 = await bot.conversation(convId);
  conversation1.say('Hello');

// async/await, from a plain javascript object
const asyncFunc2 = async () => {
  const conversationData = await bot.conversations.get(convId);
  const conversation2 = await bot.conversation(conversationData);
  conversation2.say('Hello');
};
```

Each conversation has its state represented in its properties. Example:
```
if (conversation.status === 'queued'
  && conversation.categoryIndex === 1
  && conversation.participants.find(p => p.role === 'admin' && p.active)
  && conversation.messages.length > 5
  && conversation.results.length === 0
) {
  // An admin is viewing a queued conversation in the second category
  // with more than 5 messages and no results yet
}
```
See the Messages &gt; Conversations section in the [API Reference](https://api2.chatshipper.com/) for a full list of possible properties.

### Conversation Methods

#### `conversation.organization`

If `preloadOrganizations` is set in the constructor, the (cached) full organization record, with `categories.forms` populated, is available to you on each request.

Example:
```
const bot = new ChipChat({
  token: process.env.TOKEN,
  preloadOrganizations: true
});

bot.on('message', (message, conversation) => {
  const active = conversation.forms.find(f => f.name === 'Test Drive');
  if (active) {
    const field = 'model'; //active
    return conversation.say(`.${field.key} ${message.text}`, { meta: { form: active.id } ));
  }
  // fill in some fields
  const forms = conversation.organization.categories[conversation.categoryIndex].forms;
  const form = forms.find(f => f.name === 'Test Drive');
  form.fields.forEach(f => conversation.say(`.${f.key} ${message.text}`, { meta: { form: form.id } ));
  console.log('fields', form.fields);
});

```
_NOTE: After the organization is fetched, the organization record is cached in-memory for the lifetime of the bot (and never refreshed)._


### Sending Messages

A conversation context provides helper methods to add new messages. The ChipChat instance also provides a generic `send` method that you can use to send a message into any conversation. All messages from the Send API return a Promise that you can use to apply actions after a message was successfully sent. You can use this to send consecutive messages and ensure that they're sent in the right order.

----

#### `bot.send(conversationId, message, [options])`
#### `conversation.say(message, [options])`

Send a message into the conversation. The `bot.send()` and `conversation.say()` methods can be used to send any type of message, including text messages, cards, messages with quick replies or buttons, mentions, commands, forms, fields, tags and searches.

The `message` param can be a string, an array, or an object:

- If `message` is a string, the bot will send a 'chat'-type message for the `bot` role.
- If `message` is an array of messages, the array is passed as-is (and the messages processed in-order).
- If `message` is an object, the message will be sent as a full ChatShipper message.

See the [Messaging Guide](https://developers.chatshipper.com/docs/messaging-introduction) and [API Specs](https://api2.chatshipper.com/) for the properties of messages and other information related to messaging in ChatShipper.

The conversation message sending methods like `conversation.say()` are a proxy for `bot.send()`, within the context of the conversation - the only difference is that when you use the methods from the `Conversation` instances, you don't have to specify the `conversationId`.

Example - These three methods generate identical results:

```javascript
bot.on('message', (message, conversation) => {
  const convId = conversation.id;
  bot.send(convId, 'Hello World');
});

// is the same as...
bot.on('message', (message, conversation) => {
  conversation.say('Hello World');
});

// has the same effect as
bot.on('message', (message) => {
  // create conversation context from the conversation ID
  bot.conversation(message.conversation).then(
    conversation => conversation.say('Hello World')
  );
});
```

You'll likely use the messaging methods from the `Conversation` instances (ex: `conversation.say()`, but you can use them from the `ChipChat` instance if you're not in a conversation context (for example, when you want to send a message on a schedule (independent of any event)).


The `bot.send()` and `conversation.say()` accept an optional object as a second argument, which will be merged into the message payload. This gives you an intuitive way to separate the required `message.text` from any  optional properties. The following calls are equivalent:
```
// at least a message.text is required; the default role is 'bot'
conversation.say('Hello World');
conversation.say('Hello World', () => {});
// augment first argument with optional properties
conversation.say('Hello World', { role: 'bot' }, () => {});
// provide a message object
conversation.say({ text: 'Hello World' });
// arrays should receive
conversation.say([{ text: 'Hello World', role: 'bot' }]);
```
If the first argument is an array, the options object is ignored.

### `say() examples`

```javascript
// Send a text message
conversation.say('Hello world!');

// Send a text message with quick reply buttons
conversation.say({
  text: 'Favorite color?',
  actions: [
    { type: 'reply', text: 'Red', payload: 'RED' },
    { type: 'reply', text: 'Green', payload: 'GREEN' },
    { type: 'reply', text: 'Blue', payload: 'BLUE' },
  ]
});

// Send a list of items
conversation.say({
  items: [
    { title: 'Article 1',
      mediaUrl: 'https://picsum.photos/200',
      actions: [{ type: 'link', text: 'Art 1', payload: 'http://example.org/' }]
    },
    { title: 'Article 2',
      mediaUrl: 'https://picsum.photos/200',
      actions: [{ type: 'link', text: 'Art 2', payload: 'http://example.org/' }]
    }
  ],
  actions: [
    { type: 'postback', text: 'View More', payload: 'VIEW_MORE' }
  ]
});

// Passing an array will make subsequent calls to the .say() method
// For example, calling:
conversation.say(['Hello', 'How are you?']);

// is the same as:
conversation.say('Hello').then(() => {
  conversation.say('How are you?')
});
```

----
#### `conversation.ask(message, callback)`

The `ask()` method can be used to ask a question, and process the reply (the next inmessage from an agent or contact) in its callback function.
```
conversation.ask(`What's your favorite color?`, (message, conversation) => {
  const text = message.text;
  conversation.say(`Oh, you like ${text}!`);
});
```
If `message` is a string or an object, the `.say()` method will be invoked immediately with that string or object. THe answer callback must be a function that receives the answer `message` and `conversation` params (similar to the callback function of the `.on('message')` or `.onText()` methods.

The `answer` callback function will be called whenever the user replies to the `question` with a text message, postback or quick reply.

Example: start a conversation and keep the user's answers in `conversation state` (more on that below):

```javascript
bot.onText(/^hi|hello/i, (_, conversation) => {
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
            //ctx.say(`Got it, your favorite food is ${text}`).then(() => sendSummary(ctx));
            ctx.ask(`So your favorite food is ${text}?`, () => sendSummary(ctx));
        });
    };

    const askName = (conv) => {
        conv.ask("What's your name?", (msg, ctx) => {
            const text = msg.text;
            ctx.set('name', text);
            //ctx.say(`Oh, your name is ${text}`).then(() => askFavoriteFood(ctx));
            ctx.say(`Oh, your name is ${text}`, () => askFavoriteFood(ctx));
        });
    };

    askName(conversation);
});

```

#### Registered Callbacks

In environments like Lambda functions, replies to `ask()` may not be processed in the same runtime. In these cases, you can use the `registerCallback` method to later reference it by name when calling `ask`. The answer callback is now a _string_ (the name of the callback reference). Example:

```
bot.registerCallback('answerColor', (m, c) => {
    c.say(`You like to see ${m.text}`);
    c.leave();
});

bot.registerCallback('answerFood', (m, c) => {
    c.say(`So you like eating ${m.text}`);
    c.ask({ text: 'Your favorite color?', delay: 3000 }, 'answerColor');
});

bot.on('message', (payload, ctx) => {
    ctx.ask('How are you doing?', (msg) => {
        ctx.say(`You answered ${msg.text}`);
        ctx.ask("What's your favorite food?", 'answerFood');
    });
});

module.exports = (req, res) => {
    if (req.method === 'GET') {
        res.send(req.query.challenge);
    } else if (req.method === 'POST') {
        bot.ingest(req.body, req.get('x-hub-signature'));
        res.send('ok');
    }
};

```

### Managing Conversation State

#### `conversation.set(property, value)`

| Param | Type | Default | Required |
|:------|:-----|:--------|:---------|
| `property` | string | | `Y` |
| `value` | mixed | | `Y` |

Save a value in the conversation's context. This value will be available in all subsequent questions and answers that are part of this conversation, and stored in the `conversation.meta` object.

```javascript
conversation.ask(`What's your favorite color?`, (message, conversation) => {
  const text = message.text;

  // Save the user's answer in the conversation's context.
  // You can then call conversation.get('favoriteColor')
  // in a future question or answer to retrieve the value.
  conversation.set('favoriteColor', text);
  conversation.say(`Oh, you like ${text}!`);
});
```

#### `conversation.get(property)`

| Param | Type | Default | Required |
|:------|:-----|:--------|:---------|
| `property` | string | | `Y` |

Retrieve a value from the conversation's context.
```
const color = conversation.get('favoriteColor');
conversation.say(`Your favorite color is ${color}!`);
```

### Joining, Accepting and Leaving Conversations

#### `conversation.join()`

#### `conversation.accept()`

#### `conversation.leave()`
