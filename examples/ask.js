'use strict';

const Bot = require('../lib/chipchat');

const bot = new Bot({ token: process.env.TOKEN });

const handleError = err => console.log('botErr', err);
bot.on('error', handleError);

bot.registerCallback('answerColor', (m, c) => {
    c.say(`You like the colors ${c.get('color')} and ${m.text}`);
    /*c.ask({ text: 'Is that correct' }).then(
        ({ text }) => {
            c.say(`You said ${text}`);
        }
    ).catch(handleError);*/
    // Ask using recurring registered callback
    c.ask({ text: 'Other color?' }, 'answerColor');
    c.leave();
});

bot.onText('color1', (_, conversation) => {
    // Ask using callback
    conversation.ask('What\'s your favorite color?', (message) => {
        const { text } = message;
        conversation.say(`Oh, you like ${text}!`);
        conversation.set('color', text);

        // Ask using registered callback
        conversation.ask({ text: 'Second favorite color?', delay: 1000 }, 'answerColor');
    });
});

bot.onText('color2', (m, conversation) => {
    // Ask using promise
    conversation.ask('What\'s your favorite color?').then(({ text }) => {
        conversation.say(`Oh, you like ${text}!`);
    }).catch(handleError);
});

bot.start();
