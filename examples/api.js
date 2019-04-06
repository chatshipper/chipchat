'use strict';

const Bot = require('../lib/chipchat');

const bot = new Bot({
    token: process.env.TOKEN
});

bot.listContacts({ limit: 5, sort: '-createdAt' },
    (err, contacts) => console.log(`${contacts.length} contacts returned`));

bot.listContacts({ limit: 5, sort: '-createdAt' })
    .then(contacts => (contacts[0] ? bot.getContact(contacts[0].id) : null))
    .then((contact) => {
        console.log('contact', contact);
    })
    .catch(err => console.error(err));
