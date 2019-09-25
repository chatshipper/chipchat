'use strict';

const Bot = require('../lib/chipchat');
const sendware = require('./middleware/sendParams');
const delay = require('./middleware/delay');
const stop = require('./middleware/stop');

const mwareSend1 = (bot, message, next) => {
    console.log('mwaresend1', message.text, bot.auth.user);
    message.text = 'Hello MwareOverrideSent';
    next();
};
const mwareSend2 = (bot, message, next) => {
    console.log('mwaresend2', message.text, bot.auth.user);
    next();
};
const mwareSend3 = (bot, message, next) => {
    console.log('mwaresend3', message.text, bot.auth.user);
    next();
};
const mwareSend4 = (bot, message, next) => {
    console.log('mwaresend4', message.text, bot.auth.user);
    next();
};

const mwareRecv1 = (bot, payload, next) => {
    console.log('mwarerecv1', payload.event, payload.data.message.text);
    payload.data.message.text = 'MwareOverrideReceived';
    next();
};
const mwareRecv2 = (bot, payload, next) => {
    console.log('mwarerecv2', payload.event, payload.data.message.text);
    next();
};
const mwareRecv3 = (bot, payload, next) => {
    console.log('mwarerecv3', payload.event, bot.auth.user);
    next();
};

const bot = new Bot({
    token: process.env.TOKEN,
    ignoreSelf: false,
    ignoreBots: false,
    middleware: {
        send: sendware,
        // multiple mware gets stacked/run in reverse order
        receive: [mwareRecv1, mwareRecv2].reverse()
    }
});
//bot.middleware.send.use([mwareSend2], mwareSend3);
bot.middleware.send.use(mwareSend3, mwareSend2, mwareSend1);
bot.middleware.send.use(mwareSend4);

// middleware.receive
bot.use(delay);
//bot.use([stop]);
bot.use(mwareRecv3);

bot.on('error', (err) => {
    console.log('err', err);
});

bot.on('message', (m, c) => c.say('Trigger SendMW'));

bot.start();

bot.conversations.list(
    { sort: '-createdAt', limit: 1 },
    (err, convs) => {
        bot.send(
            convs[0].id, 'Hello Mware',
            (e, msg) => console.log('said', e && e.name, msg && msg.text) //msg.text)
        );
    }
);
