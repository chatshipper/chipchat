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
See the Messages &gt; Conversations section in the [API Reference](https://api.chatshipper.com/) for a full list of possible properties.

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

##### say() examples

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

### Notifying channels and assigning users

Automations can notify (groups of) users of any conversation, through personal and shared **inboxes**.

A shared, multi-user inbox is called a ***channel***. The `/notify` command-type message puts the conversation in one or more channels, until it is accepted by one of the subscribed agents.

In addition, each user has a _personal_ ***inbox*** to which the user is always subscribed.
The `/assign` command-type message puts a conversation in a user's inbox. It will stay there until the user accepts the conversation.


#### `conversation.notify([channel], [organization])`

| Param | Type | Default | Required |
|:------|:-----|:--------|:---------|
| `channel` | string or array | | `N` |
| `organization` | string or array | | `N` |

The `notify` method (and the corresponding 'notify' command-type message it sends) can be used to send notifications into multi-user _channels_ that agents can subscribe to.

Channels can be notified in two ways:
1. triggered by ***routing rules***
2. targeted directly as ***tasks***

##### Routed notifications

To trigger a channel notification based on ***routing rules***, simply call the method without arguments:
```javascript
conversation.notify();
```
This notification will be processed by the routing rules for all organizations upwards in the organization tree (the conversation owner and any parent organizations). To target any specific organization(s), provide the organization id(s) as the second argument. The following two calls are equivalent:
```javascript
conversation.notify(null, '59b5334fcf4bae0bc81878c6');
conversation.notify(null, ['59b5334fcf4bae0bc81878c6']);
```
Routed channel notifications will be removed (dequeued) from _all routed channels_ when any agent accepts the conversation from any channel. This behaviour is identical to routing of an inbound contact message for a non-active conversation - in fact, in both cases the routing engine uses the last-received consumer message for rules matching.

##### Task notifications

Routing rules can be bypassed and target channels notified directly. Typical use case is, when you need one agent in a pool of agents (the channel) to accept, process and close the conversation. We call these targeted notifications **task notifications**.

To notify one or more specific channels of the conversation, provide a channel or list of channels as the first method argument. The following two calls are equivalent:
```javascript
conversation.notify('5a437eb33c64832bf93423f0');
conversation.notify(['5a437eb33c64832bf93423f0']);
```
In contrast to routed notifications, a targeted task notification will remain in the channel until it is accepted by an agent that is subscribed to that specific channel (and will remain in other, non-subscribed channels after that).

For more information on the `/notify` command, see the [developer documentation](https://developers.chatshipper.com/docs/messaging-commands#section--notify) about this message type.

#### `conversation.assign(users)`

| Param | Type | Default | Required |
|:------|:-----|:--------|:---------|
| `users` | string or array | | `N` |

Assign the conversation to one or more users. The users will receive an inbox notification, and the conversation will remain in the inbox until the user accepts the conversation.

For more information on the `/assign` command, see the [developer documentation](https://developers.chatshipper.com/docs/messaging-commands#section--assign).

### Joining, Accepting and Leaving Conversations

#### `conversation.join()`

Join a conversation, by adding the bot to the conversation participants list.
```javascript
conversation.join();
```
This is done automatically when the first message is sent, so this function call is not strictly necessary; ChipChat does not currently treat joined conversations other than others.

#### `conversation.accept()`

Accept a conversation - join it as a participant, set the conversation status to 'active' (if not already), and assume  responsibility for replying to the consumer. While a conversation is accepted (and thus active), no channel notifications are sent to channels, and active agents are expected to handle any inbound messages. Only consumer-facing bots need to use this method.
```javascript
conversation.accept();
```
Note: `conversation.accept()` is done automatically if your bot sends a message to a consumer (message.role: agent), and is not a conversation participant yet. It's best to have your bot explicitly join or accept the conversation (and leave afterwards) before talking to the consumer.

#### `conversation.leave()`

Leave the conversation. This is the equivalent of closing the conversation from the UI: if no other agents have it accepted, the conversation status will be set to 'closed', and any new inbound contact messages will now trigger routing notifications.

Like the accept() function, leave() is only relevant for consumer-facing bots: there's usually no need to lock/release notification flows for bots that are not controlling the conversation (talking to consumers).

As an example, for consumer bots it's a good practice to stop interacting with the consumer when another agent or bot accepts the conversation, or starts talking with the contact:
```javascript
function stop (_, conversation) {
    conversation.set('mybot.status', 'finished');
    conversation.leave();
};
bot.on('message.create.contact.command', { { text: ['/accept', '/join'] }, stop);
bot.on('message.create.contact.chat.agent', { isBackchannel: false }, stop);
```
