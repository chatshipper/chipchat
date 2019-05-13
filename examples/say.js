'use strict';

const Bot = require('../lib/chipchat');

const sendRandom = (_, { say }) => {
    // these can be received by CS in any order, depending on network latency for each call
    say('Welcome', { role: 'agent', delay: 500 });
    say('Which car', { role: 'agent', delay: 6000 });
    say('Choose ', { type: 'card', role: 'agent', delay: 12000 });
};

const sendMulti = (_, { say }) => {
    // these are guaranteed to be received at once and processed by CS in-order
    say([
        { text: 'Welcome', role: 'agent', delay: 500 },
        { text: 'In which car', role: 'agent', delay: 6000 },
        { text: 'Choose ', type: 'card', role: 'agent', delay: 12000 }
    ]);
};

const sendAsync = async (_, { say }) => {
    // these are guaranteed to be received by CS in-order
    await say('Welcome', { role: 'agent', delay: 500 });
    await say('Which car', { role: 'agent', delay: 6000 });
    await say('Choose ', { type: 'card', role: 'agent', delay: 12000 });
};

const msgs = [
    { text: 'Hi there, I will show you around in the world of bot writing...', role: 'agent', delay: 6000 },
    { text: 'And start it by typing >w1on1bot cloudbotboilerplate start', role: 'agent', delay: 9000 },
    { text: 'You can use Postman to have a look at this conversation which has id 5cd44b0d1684e7001058565b', role: 'agent', delay: 12000 },
    { text: 'You can reset the bot flow by typing >w1on1bot cloudbotboilerplate reset', role: 'agent', delay: 15000 },
    { text: 'Or jump to a specific step by typing >w1on1bot cloudbotboilerplate jump <stepname>', role: 'agent', delay: 18000 },
    { text: 'You can view the bot\'s state by typing >w1on1bot cloudbotboilerplate showinfo', role: 'agent', delay: 21000 },
    { text: 'You can wait for a question by passing waitForInput. Type anything to continue', role: 'agent', delay: 24000 }
];
const sendAsync2 = (_, { say }) => {
    msgs.forEach(async (m) => {
        const saved = await say(m);
        console.log('m', JSON.stringify(saved));
        return Promise.resolve(1);
    });
};

const bot = new Bot({
    token: process.env.TOKEN
});

bot
    .on('message.create.contact.chat.agent', { text: /random/i }, sendRandom)
    .onText('multi', { role: 'agent' }, sendMulti)
    .onText('async', { type: 'chat' }, sendAsync)
    .onText('iterate', { type: 'chat' }, sendAsync2)
    .start();
