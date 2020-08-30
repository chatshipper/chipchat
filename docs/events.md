### Receiving Events

Use the `on()` and `onText()` methods to subscribe your bot to messages, resource updates and other bot notifications.

### `.on(event, [conditions], callback)`

You can subscribe to any webhook callback events received by the webhook with the `bot.on()` method. See our [webhooks guide](https://developers.chatshipper.com/docs/pg-webhooks#section-8-2-webhook-events "ChatShipper Events") for a full list of possible events.

Subscribe to an event and execute a callback when those events are emitted. Primary events are:

| Event | Description | Payload |
|:------|:-----|:-----|
| `ready` | The webhook server is listening | null |
| `error` | An error occurred | error |
| `activity` | Any activity occurred | activity |
| `<resource>.<action>` | A resource was created, updated or deleted. Eg. `organization.update` or `form.create` | webhook payload |
| `message` | The bot received a text message. An alias for `message.create` | message, conversation |
| `assign` | A conversation was assigned to the bot's inbox | message, conversation |
| `mention` | A conversation was assigned to the bot's inbox | message, conversation |
| `command` | A bot command was entered | message, conversation |

On a `message.create` event (aliased by 'message'), one or two additional events are emitted:
  - `message.create.<conversation.type>.<message.type>`
  - `message.create.<conversation.type>.<message.type>.<message.role>` (if applicable)

#### Ready Event

The `ready` event is fired after completion of the `bot.start()` webhook setup.
```javascript
bot.on('ready', () => {
  console.log('The bot is ready');
});
bot.start();
```
#### Messaging Events

_Message creation_ events are triggered with a Message and Context (the augmented conversation) as arguments.

```javascript
bot.on('message', (message, conversation) => {
  console.log(`The user said: ${message.text} in ${conversation.name}`);
});
```
The specified callback will be invoked with 2 params: `(message, conversation)`

| Param | Description |
|:------|:-----|
| `message` | A full message, as sent by a participant into a conversation. A plain JavaScript object specified by the Messages REST API. |
| `conversation` | A `Conversation` instance that you can use to reply to the user. Contains all the properties of the conversation it represents, and methods to reply specified in the [Conversation context](#send-api) |

In addition to the catch-all `message` event, more fine-grained events are triggered:
- `message.create.<conversation.type>.<message.type>`
- `message.create.<conversation.type>.<message.type>.<message.role>` (if applicable)

Full message creation events are named after the _conversation type_ (contact, bot, agent or system) and _message type_ (chat, form, command etc) that triggered it, and for any message type that has a _role_ specified (chat, card, mention and postback), the full event with the role attached will be added.

As an example, a contact message (the webhook event type `message.create.contact.chat` would trigger these three events:
```javascript
// any message
bot.on('message', () => {});

// chat message in a contact conversation
bot.on('message.create.contact.chat', () => {});

// contact chat message (in a contact conversation)
bot.on('message.create.contact.chat.contact', (msg, conversation) => {
  // Reply into the conversation
  conversation.say('Hey, user. I got your message!');
});
```
For broader or more fine-grained event triggering, see also the use of wildcards and conditional filters below.

#### Bot-directed Events

Some message creation events are instrumental for bots in participating in conversations. In addition to their regular `message` event trigger, these events _also_ trigger as a special event alias for ease of subscribing.

Such a message event alias is triggered every time your bot gets:
- **mentioned** in a conversation;
- **assigned** a conversation in its inbox;
- receives a **bot command**.

Like message creation events, the callback receives a _Message_ and a _Conversation_ as its arguments. The event aliases are:

##### assign

Triggered when a conversation is _assigned_ to a bot (by setting the inbox flag). This usually happens when a user starts a new conversation with the bot, or when an existing conversation is assigned to the bot by routing rules.
```
bot.on('assign', (message, conversation) => {
    conversation.join();
});
```
This event trigger is equivalent to:
```
const conditions = { type: 'command', text: '/assign', users: this.auth.user };
bot.on('message', conditions, (message, conversation) => {});
```

##### mention

Triggered when someone _mentions_ the bot in any conversation.
```
bot.on('mention', (message, conversation) => {
    // Send a mention back
    conversation.say({
        text: `You said: ${msg.text}`,
        type: 'mention',
        meta: { targetUser: message.user }
    });
});
```
This event trigger is equivalent to:
```
const conditions = { type: 'mention', targetUser: this.auth.user };
bot.on('message', conditions, (message, conversation) => {});
```

##### command

Triggered when a _bot command_ is called in a conversation. Bot command responses should generally surface in the backstream.
```
bot.on('command', { text: '>location' }, (message, conversation) => {
    conversation.say({
        text: 'You are on planet earth now.',
        isBackchannel: true
    });
});
```
This event trigger is equivalent to:
```
const conditions = { type: 'command', text: /^>/ };
bot.on('message', conditions, (message, conversation) => {});
```

#### Resource Events

All resources trigger webhooks on resource creation, updates and deletion - such as the `service.create` event when a new service is created, or the `article.update` event whenever an article is updated. The webhook payload contains the corresponding resource objects; `data.service` and `data.article`, respectively.

Examples:

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

All errors are published through the `error` event. To perform custom error-handling logic, just subscribe:
```
bot.on('error', (err) => {
  console.log('Ooops', err);
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

### Event Filters

Events can be further filtered by supplying the optional **conditions** object. The event will only fire if all properties match the message and conversation context.

The keys of the conditionals object are first matched against `message` properties, or **conversation** properties if prefixed by a `@`. If the key is not a message or conversation property, it will try to match against `conversation.meta` variables.

The values are matched for equality for string, numbers and booleans. Arrays are tested for any match of one of its members, and regular expressions are tested against strings.

If all conditions match, the event is triggered. Here's an example:

```javascript
const filters1 = {
  '@category': ['Used Car', 'New Car'], // conversation property
  text: [/hello/i, 'Hi'],               // message property
  someBotStateVar: 'step1'              // conversation.meta var
};
bot.on('**.chat.contact', filters1, (message, conversation) => {
  conversation.say([
    { 'Hello. Want to buy a car?', role: 'agent' },
    `/set someBotStateVar step2`
  ]);
});
const filters2 = {
  text: [/ye(s|p)/i, 'sure'],
  someBotStateVar: ['step2', 'step3']
};
bot.on('**.chat.contact', filters2, (message, conversation) => {
  conversation.say('Okidoki', { role: 'agent' });
});
```

### `.onText(keywords, callback)`

To subscribe to specific keywords on a `message` event, use the `.onText()` method.
```javascript
bot.onText('hello', (message, conversation) => {
  conversation.say('Hello, human!');
});
```
A convenient method to subscribe to `message` events containing specific keywords. The `keyword` param can be a string, a regex or an array of both strings and regexs that will be tested against the received message. If the bot receives a message that matches any of the keywords, it will execute the specified `callback`. String keywords are case-insensitive, but regular expressions are not case-insensitive by default, if you want them to be, specify the `i` flag.

The callback's signature is identical to that of the `.on()` method above.

#### `.onText()` examples:

```javascript
bot.onText('hello', (message, conversation) => {
  conversation.say('Hello, human!');
});

bot.onText(['hello', 'hi', 'hey'], (message, conversation) => {
  conversation.say('Hello, human!');
});

bot.onText([/(good)?bye/i, /see (ya|you)/i, 'adios'], (message, conversation) => {
  // Matches: goodbye, bye, see ya, see you, adios
  conversation.say('Bye, human!');
});
```
Like the `on()` method, you can supply the optional conditions object to filter further. Example:
```
bot.onText('Goodies', { type: 'postback' }, (message, conversation) => {
  conversation.say('You clicked a button!');
});
```

**Note** that if a bot is subscribed to both the `message` event using the `.on()` method and a specific keyword using the `.onText()` method, the event will be emitted to both of those subscriptions. If you want to know if a message event was already captured by a different subsciption, you can check for the `captured` flag on the conversation.

