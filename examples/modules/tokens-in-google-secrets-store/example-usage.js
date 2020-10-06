
const ChipChat = require('chipchat');
const tokenstore = require('./token-store-module');
const tokenid = '5f773ebbe86b2e001d9cba47';

const bot = new ChipChat({ host: 'https://development-api.chatshipper.com'}); // no need for tokens
const conversationid = '5f74508c5c8917001ec2bee9';

bot.module(tokenstore, { tokenid });

//alternatively you can use new ChipChat({ token, refreshToken }) and bot.module(tokenstore);

bot.conversations.get(conversationid).then(console.log);
