'use strict';

const Bot = require('../lib/chipchat');

const bot = new Bot({
    token: process.env.TOKEN
});

const logSuc = () => console.log('succes');
const logErr = err => err && console.log('error', err.toString());
bot.on('error', logErr);

const options = { limit: 5, sort: '-createdAt' };

// callback-based
bot.contacts.list(options,
    (err, contacts) => console.log(`${contacts.length} contacts returned`));

// promise-based
bot.contacts.list(options)
    .then(contacts => (contacts[0] ? bot.contacts.get(contacts[0].id) : null))
    .then((contact) => {
        console.log('contact', contact);
    })
    .catch(err => console.error(err));

// callback-based conversation creation
bot.conversations.create(
    { name: 'Review', messages: [{ text: 'start' }] },
    async (err, conversation) => {
        const conv = await bot.conversation(conversation);
        conv.say('Hello!');
        bot.send(conversation.id, {
            type: 'command',
            text: '/notify'
        });
    }
);

// promise-based conversation creation
bot.conversations.create(
    { name: 'Review', messages: [{ text: 'start' }] }
).then(
    (conversation) => {
        console.log('conversation created: ', conversation.id, conversation.name);
        // Contextualize the conversation, send a message using say()
        bot.conversation(conversation)
            .then(conv => conv.say('Howdy!'))
            .then(logSuc).catch(logErr);
        // Send a message using bot.send(id) directly
        bot.send(conversation.id, {
            type: 'command',
            text: '/notify'
        }).then(logSuc).catch(logErr);
    }
).then(logSuc).catch(logErr);
