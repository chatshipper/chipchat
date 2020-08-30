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
fields are filled or the form is triggered. adding multiple lines to
the article leads to multiple quick replies

 */

const Bot = require('../lib/chipchat');

const bot = new Bot({ token: process.env.TOKEN });
const log = console.log;
const errHandle = err => log('botErr', err);
bot.on('error', errHandle);

const wrap = payloads => ({ text: 'quick replies', actions: payloads.map(p => ({ type: 'reply', payload: p })), meta: { hidden: true } });

bot
    .on('**.form', { text: /^\+/ }, (m, c) => {
        log('form event', m);
        if (m.meta.form) {
            bot.forms.get(m.meta.form).then((form) => {
                if (form.meta && form.meta.init && /article:/.test(form.meta.init)) {
                    return bot.articles.get(form.meta.init.split(':').pop()).then((article) => {
                        const replies = wrap(article.content
                            .split(/\n/)
                            .map(a => a.replace(/^<p>(.*)<\/p>$/, '$1'))
                            .filter(q => q.trim() && q.trim() !== '<br />'));
                        return c.say(replies);
                    }).catch(errHandle);
                }
                return Promise.resolve();
            }).catch(errHandle);
        }
    })
    .on('**.field', (m, c) => {
        log('field event', m);
        if (m.meta.form) {
            bot.forms.get(m.meta.form).then((form) => {
                if (form.meta && form.meta[m.meta.key] && /article:/.test(form.meta[m.meta.key])) {
                    return bot.articles.get(form.meta[m.meta.key].split(':').pop()).then((article) => {
                        const replies = wrap(article.content
                            .split(/\n/)
                            .map(a => a.replace(/^<p>(.*)<\/p>$/, '$1'))
                            .filter(q => q.trim() && q.trim() !== '<br />'));
                        return c.say(replies);
                    }).catch(errHandle);
                }
                return Promise.resolve();
            }).catch(errHandle);
        }
    }).start();
