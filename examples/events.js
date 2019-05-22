'use strict';

const Bot = require('../lib/chipchat');

const bot = new Bot({
    token: process.env.TOKEN
});

bot.on('ready', () => {
    console.log('ready', bot.auth);
});

bot.on('error', (err) => {
    console.log('err', err);
});

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

bot.onAny((event, payload, ctx) => {
    if (ctx) {
        console.log('Message event triggered:', event, Object.keys(payload).join(','));
    } else {
        console.log('Non-message event triggered:', event, Object.keys(payload).join(','));
    }
});

bot.onText([/hi/, 'hello'], (msg, [source, match]) => {
    //const { chat: { id } } = msg;
    //let settingsMessage = (Object.keys(settings).length == 0) ?
    //'No settings. Please set settings by a /start command': settings;
    console.log('match', source, match);
    bot.send(msg.conversation, 'Your settings');
});

bot.emit('foo', { bar: 'baz' });

bot.start();
