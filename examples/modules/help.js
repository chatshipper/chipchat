'use strict';

module.exports = (bot) => {
    bot.on('postback.*', (payload, chat) => {
        chat.say(`You clicked ${payload.text}`);
    });
    bot.on('message.create.*.*', (payload, chat) => {
        const buttons = [
            { type: 'postback', text: 'Settings', payload: 'HELP_SETTINGS' },
            { type: 'postback', text: 'Notifications', payload: 'HELP_NOTIFICATIONS' }
        ];
        chat.say({ text: 'Need help?', actions: buttons });
        chat.set('captured', true);
    });
};
