'use strict';

const Bot = require('../lib/chipchat');

const bot = new Bot({
    token: process.env.TOKEN
});

const options = { limit: 5, sort: '-createdAt' };

bot.contacts.list(options,
    (err, contacts) => console.log(`${contacts.length} contacts returned`));

bot.contacts.list(options)
    .then(contacts => (contacts[0] ? bot.contacts.get(contacts[0].id) : null))
    .then((contact) => {
        console.log('contact', contact);
    })
    .catch(err => console.error(err));
