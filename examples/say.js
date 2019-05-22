'use strict';

const Bot = require('../lib/chipchat');

const sendRandom = (_, { say }) => {
    // these can be received by CS in any order, depending on network latency for each call
    say('Message 1', { role: 'agent', delay: 500 });
    say('Message 2', { role: 'agent', delay: 6000 });
    say('Message 3', { type: 'card', role: 'agent', delay: 12000 });
};

const sendMulti = (_, { say }) => {
    // these are guaranteed to be received at once and processed by CS in-order
    say([
        { text: 'Start', role: 'agent', delay: 500 },
        { text: 'Step 1', role: 'agent', delay: 6000 },
        { text: 'Step 2', type: 'card', role: 'agent', delay: 12000 }
    ]);
};

const sendAsync = async (_, { say }) => {
    // these are guaranteed to be received by CS in-order
    await say('Welcome', { role: 'agent', delay: 500 });
    await say('Which car', { role: 'agent', delay: 6000 });
    await say('Choose ', { type: 'card', role: 'agent', delay: 12000 });
};

const msgs = [
    { text: 'First message', role: 'agent', delay: 6000 },
    { text: 'Second message', role: 'agent', delay: 9000 },
    { text: 'Third message', role: 'agent', delay: 12000 },
    { text: 'Fourth message', role: 'agent', delay: 15000 },
    { text: 'Fifth message', role: 'agent', delay: 18000 }
];
const sendSequential = async (_, { say }) => {
    let delay = 0;
    for (const m of msgs) { // eslint-disable-line no-restricted-syntax
        const saved = await say(m.text, { delay }); // eslint-disable-line no-await-in-loop
        delay += 3000;
        console.log('m', JSON.stringify(saved));
    }
};

const sendParallel = async (_, { say }) => {
    const results = [];
    let delay = 0;
    for (const m of msgs) { // eslint-disable-line no-restricted-syntax
        // All asynchronous operations are immediately started.
        results.push(say(m.text, { delay }));
        delay += 3000;
    }
    // Now that all the asynchronous operations are running, here we wait until they all complete.
    const res = await Promise.all(results);
    console.log('res', res);
};

const bot = new Bot({
    token: process.env.TOKEN
});

bot
    .onText(/random/i, sendRandom)
    .onText('multi', { role: 'agent' }, sendMulti)
    .onText('async', { type: 'chat' }, sendAsync)
    .onText('iterate', { type: 'chat' }, sendSequential)
    .onText('parallel', { type: 'chat' }, sendParallel)
    .start();
