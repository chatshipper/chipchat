'use strict';

const Bot = require('../lib/chipchat');

const bot = new Bot({
    token: process.env.TOKEN
});

bot.on('message.create.contact.chat.agent', (payload, actions) => {
    console.log('on.message', payload.text);
    if (payload.text === 'Ping') {
        actions.say('Pong', (err) => {
            if (err) throw err;
            console.log('Ponged back');
        });
    }
});

bot.onAny((event, msg, ctx) => {
    console.log('any', event, ctx ? ctx.name : 'no context');
});

bot.on('error', (err) => {
    console.log('err', err);
});

bot.start();
