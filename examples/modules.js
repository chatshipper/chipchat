'use strict';

const Bot = require('../lib/chipchat');
const echoModule = require('./modules/echo');
const helpModule = require('./modules/help');

const bot = new Bot({
    token: process.env.TOKEN
});

bot.module(echoModule, { onlyOnce: true });
bot.module(helpModule);

bot.start();
