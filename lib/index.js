const ChipChat = require('./chipchat');
const AuthMethods = require('./auth');

ChipChat.mixin(AuthMethods);

module.exports = ChipChat;
