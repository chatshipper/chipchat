//Stop operation call (and the next middlewares)
module.exports = function someMiddleware(bot, payload, next) {
    console.log('stop');
};
