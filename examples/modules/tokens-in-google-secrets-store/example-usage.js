/*
 * before you can use this, you have to set the 5f773ebbe86b2e001d9cba47_token and
 * 5f773ebbe86b2e001d9cba47_refreshToken in the store from the CLI
 * with echo -n "<paste your token here>" || gcloud secrets create 5f773ebbe86b2e001d9cba47_token
 * --data-file=- --replication-policy automatic --project=<paste your project here>
 */

const ChipChat = require('chipchat');
const tokenstore = require('./token-store-module');
const tokenid = '5f773ebbe86b2e001d9cba47';

const bot = new ChipChat({ host: 'https://development-api.chatshipper.com'}); // no need for tokens
const conversationid = '5f74508c5c8917001ec2bee9';

bot.module(tokenstore, { tokenid });

//alternatively you can use new ChipChat({ token, refreshToken }) and bot.module(tokenstore);

bot.conversations.get(conversationid).then(console.log);
