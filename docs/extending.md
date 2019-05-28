
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
