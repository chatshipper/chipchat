'use strict';

const ChipChat = require('../lib/chipchat');

const bot = new ChipChat({
    token: process.env.TOKEN
});
bot.users.get(bot.auth.user).then((botUser) => {
    console.log(`Hello ${botUser.name}`);
});
bot.on('message', (msg, ctx) => {
    ctx.say({ text: '👍', role: 'agent' });
});

bot.on('notify', (msg, ctx) => ctx.accept());
bot.on('message', (msg, ctx) => ctx.say(`Echo: ${msg.text}`));

bot.start();
