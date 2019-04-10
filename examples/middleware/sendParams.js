// Modify params given to the operation (before the call)
module.exports = function someMiddleware() {
    return next => function(params, callback, options) {
console.log('mungeparam');
        const newParams = {
            ...params,
            foo: 'bar',
        };
        next(newParams, callback, options);
    };
}
