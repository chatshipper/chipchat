const Sdk = require('../lib/chipchat');

const sdk = new Sdk({
    token: process.env.TOKEN
});
// examples of pagination.all

/*

(async () => {
    const messages = await sdk.messages.list({ conversation: '5e063af76ced54001123a503',
        pagination: { }
    });
    console.log('messages: ', messages.length, messages.map(m => m.id));
})();
*/

/*
sdk.messages.list({
    conversation: '5e063af76ced54001123a503',
    pagination:
    {
        limit: 5,
        countLimit: 20,
        backoff: 1000
    }
}).then(messages => { console.log('nr of messages:', messages.length, messages.map(m => m.id)); });
*/

// examples of pagination.each
(async () => {
    try {
        const pagination = sdk.messages.list({
            pagination: {
                iterate: true,
                limit: 5,
                countLimit: 20,
                backoff: 1000
            }
        });
        //eslint-disable-next-line
        for await (const message of pagination) {
            console.log(message.id);
        }
    } catch (e) {
        console.log(e);
    }
})();
