module.exports = function someMiddleware(bot, payload, next) {
    console.log('error');
    next(new Error('nextErr'));
};
