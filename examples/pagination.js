const Sdk = require('../lib/chipchat');

const sdk = new Sdk({
    token: process.env.TOKEN
});
//const conversation = '<your test conversation id with at least 20 messages>';
const conversation = '5e063af76ced54001123a503';

// examples of pagination.all
/*
(async () => {
    // activate pagination with all defaults:
    // pagination slice size 100
    // countLimit 2000
    // requestLimit 10000
    const messages = await sdk.messages.list({ conversation,
        pagination: {}
    });
    console.log('messages: ', messages.length, messages.map(m => m.id));
})();
*/
/*
sdk.messages.list({
    conversation,
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
            conversation,
            pagination: {
                iterate: true, // this will make it an iterable
                limit: 5,
                countLimit: 20
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
