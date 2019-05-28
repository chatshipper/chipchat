'use strict';

const Bot = require('../lib/chipchat');

const bot = new Bot({
    token: process.env.TOKEN
});

const onJoin = (m, c) => {
    const part = c.participants.find(p => p.user === m.user) || {};
    // When agent or admin joins, ask to start a review
    if (part.role === 'agent' || part.role === 'admin') {
        c.say({
            text: `Hi ${part.name}, review this conversation?`,
            isBackchannel: true,
            actions: [
                { type: 'postback', text: 'yes', payload: 'REVIEW' }
            ]
        });
    // Start review process for guests immediately
    } else {
        startReview(m, c);
    }
};

const onResults = (m, c) => {
    c.say({
        text: '<span/>',
        contentType: 'text/html',
        type: 'card',
        actions: [
            { type: 'postback', text: 'Review this result', payload: 'REVIEW' }
        ]
    });
};

const startReview = (m, c) => {
    const message = {
        text: 'Conversation any good?',
        isBackchannel: m.type !== 'results',
        actions: [
            'Awesome', 'Excellent', 'Outstanding'
        ].map(action => ({ type: 'reply', text: action, payload: action }))
    };
    c.ask(message, (m2, c2) => {
        c2.say(`You said: ${m2.text}`, { isBackchannel: true, delay: 2000 });
        c2.say({
            text: 'Report',
            type: 'report',
            isBackchannel: true,
            delay: 3500,
            results: [{
                name: 'Conversation Review',
                values: { review: m2.text }
            }]
        });
        // Leave the conversation - don't
        // linger on as an active participant (optional)
        //c2.leave();
    });
};

// Set bot event handlers:
bot
// add a review invite after a results message
.on('message.create.contact.results', onResults)

// agents/guests join by clicking a link
.on('message.create.contact.command', { text: '/join' }, onJoin)

// agent clicked start review button
.on('message.create.contact.postback.agent', { text: 'REVIEW' }, startReview)

// listen to bot command
.on('notify', { type: 'command', text: '>review' }, startReview)

// start the bot
.start();
