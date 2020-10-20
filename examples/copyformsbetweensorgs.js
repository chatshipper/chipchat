/*
 * Copy forms from one org to another
 * before your run this:
 * export ORG1 (source org) and ORG2 (destination org)
 * export TOKEN
 */

'use strict';

const Bot = require('../lib/chipchat');

const log = console.log;
const api = new Bot({
    token: process.env.TOKEN
});

const logErr = err => err && log('error', err.toString());
const oneSecond = () => new Promise((resolve) => setTimeout(resolve, 1000));

// let us know when something ges wrong in api
api.on('error', logErr);

const fromOrgId = process.env.ORG1;
const toOrgId = process.env.ORG2;

log(`copying forms from ${fromOrgId} to ${toOrgId}`);
api.forms.list({ organization: fromOrgId }).then(async (forms) => {
    if (forms) {
        forms.forEach(async (form) => {
            log(`copying form ${form.id}`, form);
            await api.forms.create({ ...form, organization: toOrgId }).catch(logErr);
            await oneSecond;
        });
    } else {
        log('no forms found');
    }
});
