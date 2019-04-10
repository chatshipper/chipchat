'use strict';

const Bot = require('../lib/chipchat');

const bot = new Bot({
    token: process.env.TOKEN
});

bot.on('notify', (m, c) => {
    console.log('notify', c.id, JSON.stringify(m));
    console.log('organization', JSON.stringify(c.organization));
    //c.accept();
    c.say('Gotta go!'); // auto-accepts?
    c.leave();
    c.notify();
});

//bot.channels.subscribeAll();

bot.on('ready', (user) => {
    console.log('ready', user);
});
bot.on('error', (err) => {
    console.log('err', err);
});

bot.on('postback.*', (m, c) => {
    console.log('postback', m.text);
    c.set('step', 3);
    c.say('You have taken 3 steps');
});

bot.on('message', (m, c) => {
    if (!c.get('@category')) {
        console.log('set category');
        c.set('@category', 2);
    }
    switch (c.get('step')) {
        case '1':
            c.say({ text: 'Take step 2', actions: [{ type: 'postback', payload: 'STEP', text: 'take a step' }] });
            c.set('step', 2);
            break;
        case '2':
            c.say('You have taken two steps');
            break;
        default:
            c.say('Take a step by saying something');
            c.set('step', 1);
    }
});


bot.start();
