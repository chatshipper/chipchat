
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

=======================

## Webhook Middleware

    const http = require('http');
    http.createServer(bot.middleware()).listen(3200);
    console.log('Bot server running at port 3200.');

## Bot Middleware

A ChipChat bot is an object containing an array of middlewares which are composed and executed in a stack-like manner upon request. Is similar to many other middleware systems that you may have encountered such as Koa, Ruby's Rack, Connect.

Middleware is an essential part of any modern framework. It allows you to modify requests and responses as they pass between the ChatShipper and your bot.

You can imagine middleware as a chain of logic connection your bot to the ChatShipper request.

Middleware normally takes two parameters (ctx, next), ctx is the context for one ChatShipper update, next is a function that is invoked to execute the downstream middleware. It returns a Promise with a then function for running code after completion.

```
const bot = new ChipChat(process.env.BOT_TOKEN)

bot.use((ctx, next) => {
  const start = new Date()
  return next(ctx).then(() => {
    const ms = new Date() - start
    console.log('Response time %sms', ms)
  })
})
bot.on('notify', (ctx) => ctx.join())
bot.on('message', (msg, ctx) => ctx.reply('Hello World'))
```
### Cascading with async functions

You might need Babel or node >=v.7.x with harmony flags or @std/esm package for running following example.
```
bot.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log('Response time %sms', ms)
})
```
### Known middleware
* webhook
* internationalization


https://github.com/yoshuawuyts/http-middleware/blob/master/index.js
https://medium.com/@selvaganesh93/how-node-js-middleware-works-d8e02a936113


https://github.com/botify-labs/botify-sdk-js-middlewares/blob/master/docs/howToWriteYourOwnMiddleware.md

# How to write your own middleware

Middlewares are functions that perform tasks before and after an operation (that call an API endpoint).

They can be used to modify parameters given to the operation, modify data received by the API, stop an operation call, cache data on the fly, batch requests, etc.

## Examples
Example middlewares can be found at [there](../src/middlewares); you should read them first as they provide simple examples of what you can achieve with this project.

## Structure
```JS
/**
 * @param  {String} middlewareAPI.contollerId ie. 'AnalysesController'
 * @param  {String} middlewareAPI.operationId ie. 'getAnalysisInfo'
 * @return {Middleware}
 */
export default function someMiddleware({contollerId, operationId}) {

  /**
   * @metaparam {Func}     next Function to call with modified arguments for the next middleware
   * @param     {Object}   params
   * @param     {Function} callback
   * @param     {Object}   options
   * @return    {Boolean}  Return false to stop middlewares chain and prevent operation to be called
   */
  return next => function(params, callback, options) {
    // Perform any kind of modifications on arguments
    // Or even stop operation call
  };
}
```

## Use cases
All of the following use cases can be composed to match your needs. Keep in mind that they are just examples.

### Modify params given to the operation (before the call)
```JS
export default function someMiddleware() {
  return next => function(params, callback, options) {
    const newParams = {
      ...params,
      foo: 'bar',
    };
    next(newParams, callback, options);
  };
}
```

### Modify data received by the API
```JS
export default function someMiddleware() {
  return next => function(params, callback, options) {
    next(
      params,
      function(error, result) {
        if (!error) {
          result = _.indexBy(result, 'id');
        }
        callback(error, result);
      },
      options
    );
  };
}
```

### Stop operation call (and the next middlewares)
```JS
export default function someMiddleware() {
  return next => function(params, callback, options) {
    callback(new ForbiddenError());
    return false;
    //Don't forget to call the callback to give the result to the caller.
  };
}
```

### Delay call
```JS
export default function someMiddleware() {
  return next => function(params, callback, options) {
    setTimeout(() => {
      next(...arguments);
    }, 3000);
  };
}
```
