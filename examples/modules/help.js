'use strict';

module.exports = (bot) => {
    //bot.hear('help', (payload, chat) => {
    //bot.on('message.*.contact.contact', { text: /help/i }, cb)
    bot.on('message.create.*.*', (payload, chat) => {
        //const text = payload.message.text;
        const buttons = [
            { type: 'postback', title: 'Settings', payload: 'HELP_SETTINGS' },
            { type: 'postback', title: 'Notifications', payload: 'HELP_NOTIFICATIONS' }
        ];
        chat.say({ text: 'Need help?', actions: buttons });
        chat.set('captured', true);
    });
};
