//Delay call
module.exports = function someMiddleware(bot, payload, next) {
    setTimeout(() => {
        next();
    }, 3000);
};
