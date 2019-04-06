'use strict';

const Bot = require('../lib/chipchat');

const bot = new Bot({
    token: process.env.TOKEN
});

bot.on('message.create.system.chat', (payload, actions) => {
    console.log('on.message', payload.text);
    if (payload.text === 'Ping') {
        //lastConversation = payload.conversation;
        actions.reply({ text: 'Pong' }, (err) => {
            if (err) throw err;
            console.log('Ponged back');
        });
    }
});

bot.on('error', (err) => {
    console.log('err', err);
});

bot.start();
