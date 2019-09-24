'use strict';

module.exports = (bot, options) => {
    bot.on('message.create.*.*', (payload, chat) => {
        const text = payload.text;
        if (options.onlyOnce && chat.get('captured')) { return; }
        chat.say(`Echo: ${text}`);
    });
};
