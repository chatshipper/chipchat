'use strict';

const ChipChat = require('../lib');

ChipChat.mixin({
    foo: c => c.say('Okidoki')
});

const bot = new ChipChat({
    token: process.env.TOKEN
});

bot.on('message.*.*.*', (m, c) => bot.foo(c));

bot.start();

bot.refreshToken();
