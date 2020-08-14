'use strict';

/* Form Guide Bot

Create a form with the field keys as meta vars,
pointing to articles as values. Use meta.init to trigger
an article when the form is added.

GET /v2/forms/5c785defe8565165be1c4f66
{
    ...
    "fields": [
        {
            "name": "brand", ...
        },
        {
            "name": "model", ...
        }
    ],
    "meta": {
        "init": "article:5ee6b79c00800e65f4ea2576",
        "brand": "article:5efd0a63d8eec04580373150",
        "model": "article:5efd0a4dd8eec0458037314e",
    }
}

Run the bot. The articles now surface as QuickReplies when the
fields are filled or the form is triggered.

 */

const Bot = require('../lib/chipchat');

const bot = new Bot({ token: process.env.TOKEN });

const errHandle = err => console.log('botErr', err);
bot.on('error', errHandle);

const wrap = payload => ({ text: payload, actions: [{ type: 'reply', payload }], meta: { hidden: true } });

bot
    .on('**.form', { text: /^\+/ }, (m, c) => {
        bot.forms.get(m.meta.form).then((form) => {
            if (form.meta && form.meta.init && /article:/.test(form.meta.init)) {
                bot.articles.get(form.meta.init.split(':').pop()).then((article) => {
                    c.say([wrap(article.content.replace(/^<p>(.*)<\/p>$/, '$1'))]);
                }).catch(errHandle);
            }
        }).catch(errHandle);
    })
    .on('**.field', (m, c) => {
        bot.forms.get(m.meta.form).then((form) => {
            if (form.meta && form.meta[m.meta.key] && /article:/.test(form.meta[m.meta.key])) {
                bot.articles.get(form.meta[m.meta.key].split(':').pop()).then((article) => {
                    c.say([wrap(article.content.replace(/^<p>(.*)<\/p>$/, '$1'))]);
                }).catch(errHandle);
            }
        }).catch(errHandle);
    })
    .start();
