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
// and exported on the console before your run this example
const tokenid = process.env.BOTID;

// Options are empty by default
// you can overrule the host
const options = {};
if (process.env.HOST) options.host = process.env.HOST;

const bot = new ChipChat(options); // no need for tokens

bot.module(tokenstore, { tokenid });

//alternatively you can use new ChipChat({ token, refreshToken }) and bot.module(tokenstore);

const conversationid = process.env.CONVERSATION;
bot.conversations.get(conversationid).then(console.log);
