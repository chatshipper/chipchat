'use strict';

const Bot = require('../lib/chipchat');

const mwareSend1 = (bot, payload, next) => {
    console.log('mwaresend1', payload.event, bot.auth.user);
    next();
};
const mwareSend2 = (bot, payload, next) => {
    console.log('mwaresend2', payload.event, bot.auth.user);
    next();
};
const mwareSend3 = (bot, payload, next) => {
    console.log('mwaresend3', payload.event, bot.auth.user);
    next();
};

const mwareRecv1 = (bot, payload, next) => {
    console.log('mwarerecv1', payload.event, bot.auth.user);
    next();
};
const mwareRecv2 = (bot, payload, next) => {
    console.log('mwarerecv2', payload.event, bot.auth.user);
    next();
};
const mwareRecv3 = (bot, payload, next) => {
    console.log('mwarerecv3', payload.event, bot.auth.user);
    next();
};

const bot = new Bot({
    token: process.env.TOKEN,
    middleware: {
        send: mwareSend1,
        // multiple mware gets stacked/run in reverse order
        receive: [mwareRecv1, mwareRecv2].reverse()
    }
});
bot.middleware.send.use([mwareSend2], mwareSend3);

// middleware.receive
bot.use(mwareRecv3);

bot.on('error', (err) => {
    console.log('err', err);
});

bot.start();

bot.listConversations({ sort: '-createdAt', limit: 1 },
    (err, convs) => {
        bot.say(convs[0].id, 'Hello');
    }
);
