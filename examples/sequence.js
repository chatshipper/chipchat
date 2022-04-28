'use strict';

const ChipChat = require('../lib/chipchat');

const bot = new ChipChat({
    token: process.env.TOKEN
});
bot.users.get(bot.auth.user).then((botUser) => {
    console.log(`Hello ${botUser.name}`);
});
bot.on('message', async (msg, ctx) => {
    ctx.say({ text: '1', role: 'agent' });
    ctx.say({ text: '2', role: 'agent' });
    ctx.say({ text: '2', role: 'agent' });
    ctx.say({ text: '2', role: 'agent' });
    ctx.say({ text: '5', role: 'agent' });
    ctx.say({ text: '6', role: 'agent' }, ()=>console.log('sent'));
    console.log('group of messages processed');

    (async () => {
        console.log('begin sending one by one');
        await ctx.say({ text: '7', role: 'agent' });
        await ctx.say({ text: '8', role: 'agent' });
        await ctx.say({ text: '9', role: 'agent' });
        ctx.leave();
        console.log('done');
    })()
});

bot.on('notify', (msg, ctx) => ctx.accept());

bot.start();
