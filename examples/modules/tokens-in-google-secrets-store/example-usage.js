/*
 * before you can use this, you have to set the 5f773ebbe86b2e001d9cba47_token and
 * 5f773ebbe86b2e001d9cba47_refreshToken in the store from the CLI
 * with echo -n "<paste your token here>" || gcloud secrets create 5f773ebbe86b2e001d9cba47_token
 * --data-file=- --replication-policy automatic --project=<paste your project here>
 */

const ChipChat = require('chipchat');
const tokenstore = require('./token-store-module');

// The tokenid is the bots user id that is found in
// the properties panel of the bot (for the bot owner)
const tokenid = '5f773ebbe86b2e001d9cba47';

const bot = new ChipChat({ host: 'https://development-api.chatshipper.com'}); // no need for tokens
bot.module(tokenstore, { tokenid });

//alternatively you can use new ChipChat({ token, refreshToken }) and bot.module(tokenstore);

const conversationid = '5f74508c5c8917001ec2bee9';
bot.conversations.get(conversationid).then(console.log);
