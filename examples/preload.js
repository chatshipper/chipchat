'use strict';

const Bot = require('../lib/chipchat');

const bot = new Bot({
    token: process.env.TOKEN,
    preloadOrganizations: true,
    preloadBots: true
});

bot.on('message.create.contact.chat.agent', (message, context) => {
    console.log('botId', bot.auth.user);
    console.log('bot instance', context.instance);
    console.log('organization', context.organization);
});

bot.on('error', (err) => {
    console.log('err', err);
});

bot.start();
