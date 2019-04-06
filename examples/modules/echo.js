'use strict';

module.exports = (bot) => {
    //bot.on('message', (payload, chat) => {
    bot.on('message.create.*.*', (payload, chat) => {
        const text = payload.message.text;
        if (chat.get('captured')) { return; }
        if (chat.meta.captured) { return; }
        chat.say(`Echo: ${text}`);
    });
};
