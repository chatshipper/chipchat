/*
 * before you can use this, you have to set the <botid>_token
 * in the store from the CLI with
 * echo -n '{"token":"<paste your token here>", "refreshToken":"<paste your refreshToken here>"}' \
 * | gcloud secrets create $BOTID_token
 * --data-file=- --replication-policy automatic --project $GOOGLEPROJECT
 */

const ChipChat = require('chipchat');
const { getTokens, setTokens } = require('./token-store-mixin');

ChipChat.mixin({ getTokens, setTokens });

// The bots email is needed to request new tokens
// with the refreshToken and is also used to store the
// tokens in the google secrest store.
// The bots user id that is found in
// the properties panel of the bot (for the bot owner)
const email = `bot+${process.env.BOTID}@chatshipper.com`;
const bot = new ChipChat({ email }); // no need for tokens, email is enought

//alternatively you can use new ChipChat({ token, refreshToken })

const conversationid = process.env.CONVERSATION;
bot.conversations.get(conversationid).then(console.log);
