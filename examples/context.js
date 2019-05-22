'use strict';

const Bot = require('../lib/chipchat');

const bot = new Bot({
    token: process.env.TOKEN
});

bot.on('ready', () => {
    console.log('ready', bot.user);
});

bot.on('error', (err) => {
    console.log('handle error', err);
});

bot.on('message', (_, conversation) => {
    const convId = conversation.id; //'5cd8c48dabd2dc52deb1cfb2';
    bot.conversation(convId).then(ctx => ctx.say('Hooked in1'));
    bot.conversation(convId, (err, ctx) => ctx.say('Hooked in2'));

    bot.conversation(null, err => console.log('ERROR', err.toString()));
    bot.conversation(null).then(ctx => ctx.say('Error bypassed')).catch(err => console.log('ERROR PROMISE', err.toString()));

    bot.conversations.list().then(convs => console.log('fetched convs', convs.length));
    console.log('convsprop', bot.conversations);

    bot.conversations.create({ messages: [{ text: 'Hi' }] })
        .then(conv => console.log('created', conv.name))
        .catch(err => console.log('created err', err.toString()));
});

bot.on('message', (_, conversation) => {
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

bot.start();
