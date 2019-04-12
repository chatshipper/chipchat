'use strict';

const Bot = require('../lib/chipchat');

const bot = new Bot({
    token: process.env.TOKEN
});

bot.on('ready', () => {
    console.log('ready', bot.user);
});

bot.on('error', (err) => {
    console.log('err', err);
});

bot.on('message', (payload, chat) => {
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

    askName(chat);
});

bot.start();
