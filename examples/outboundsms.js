const Api = require('chipchat');
const debug = require('debug');
const packageJSON = require('../package.json');

const log = debug(`${packageJSON.name}(${packageJSON.version})`);
const bot = new Api({ token: process.env.TOKEN });

// fill in the clp url where the widget is running
const host = '';
// fill in the sender id you would like to use
const SenderID = '';
//fill in the first message (a welcome message before the link is send)
const welcomeMessage = 'hi there, it is time to make an appoinment again...';

// the country code to use
const countrycode = '+31';
// the locale of the contacts
const locale = 'en';

// in real life you would get these contacts from CS itself
const users = [
    { telephone: '+31612345678', email: 'barack.obama@usa.com', givenName: 'Barack', familyName: 'Obama', address: { 'Zip Code': '', 'City': '' } }
];

const sendInvitePerSMS = async (organization, ctx) => {
    //eslint-disable-next-line
    for await (const user of users) {
        log('inviting user via sms: %j', user);

        let phone = user.telephone;
        if (phone.toString().trim().length === 9) {
            phone = countrycode + phone;
        }

        const welcomeMess = {
            text: welcomeMessage,
            role: 'agent',
            delay: 1000,
            touchpoint: 'sms'
        };
        if (SenderID !== '') {
            welcomeMess.meta = { SenderID };
        }
        const messages = [
            {
                text: '/accept',
                type: 'command'
            },
            welcomeMess,
            {
                role: 'agent',
                text: 'Please click on the link to plan your meeting with us:',
                meta: { SenderID },
                touchpoint: 'sms',
                // delay is needed to give sms party time to create service and link to this account
                delay: 10000,
                actions: [{
                    text: 'link:',
                    type: 'link',
                    //make sure you pass all extra params as well
                    uri: `${host}${host.includes('?') ? '&' : '?'}`
                        + `id={authuser}&token={authtoken}&ts=${new Date().getTime()}`
                }]
            },
            {
                text: '/leave',
                type: 'command',
                delay: 11000
            }
        ];
        // eslint-disable-next-line
        await bot.contacts.list({
            'profile.telephone': phone,
            organization
        }).then(async (contacts) => {
            log('contactList: %j, %j', contacts);
            if (typeof contacts === 'object' && contacts.length > 0) {
                log('contact already exists, reinviting %j', contacts.length);
                log('sending invitation messages: %j', messages);
                await bot.conversation(contacts[0].conversation).then((conv) => {
                    messages.forEach(async (msg) => {
                        await conv.say(msg);
                    });
                });
            } else {
                log(`creating contact ${user.givenName} ${user.familyName} with phone ${phone} in org ${organization}`);
                const profile = {
                    ...user,
                    locale,
                    telephone: phone
                };
                const conv = {
                    organization,
                    type: 'contact',
                    //"tags": ["appoinmentreason", "spring tBot-3.1.1 batch-2"],
                    contact: { profile },
                    messages,
                    meta: {}
                };

                log('creating conversation', JSON.stringify(conv, null, 4));
                await bot.conversations.create(conv).then((conversation) => {
                    log('created!: %j', conversation || 'no conversation created');
                }).catch(async (e) => {
                    log('creation failed!: ', e);
                    await ctx.say({
                        text: `sending to ${profile.givenName} ${profile.familyName} (${phone}) failed: ${e && e.message}`,
                        isBackchannel: true
                    });
                });
            }
        });
        log('done sending to users');
    }
};

bot.on('error', (err) => {
    log('error occured in SMSBot', err);
});
//let lastText = '';
bot.on('message.create.system.command', { text: '>smsbot' }, async (m, c) => {
    const org = m.orgPath.split('#').slice(-1)[0];
    const conversationDetails = await bot.conversations.get(m.conversation, { select: 'participants' });
    const activeAdmin = conversationDetails.participants.find(p => p.active === true && p.role === 'admin');
    const organization = await bot.organizations.get(org, { select: 'commands,displayName' });
    const hasSMS = await bot.services.list({ organization: org, type: 'twilio' });
    if (activeAdmin && m.orgPath.includes(activeAdmin.organization)) {
        if (hasSMS && hasSMS.length > 0) {
            try {
                const confirmationMessage = {
                    text: `Weet je zeker dat je een SMS wilt sturen naar ${users.length} klant(en)?`,
                    isBackchannel: true,
                    actions: [
                        'Ja', 'Nee'
                    ].map(action => ({ type: 'reply', text: action, payload: action }))
                };
                c.ask(confirmationMessage, async (msgConfirmation, ctxConfirmation) => {
                    if (msgConfirmation.text === 'Ja') {
                        sendInvitePerSMS(users, org, ctxConfirmation).then(async () => {
                            await ctxConfirmation.say({
                                text: 'Verstuurd! Als je me weer nodig hebt start dan weer een gesprek met mij via >smsbot',
                                isBackchannel: true
                            });
                            await ctxConfirmation.say({ type: 'command', text: '/leave' });
                            /* this did not work, leave would not arrive at CS
                                    ctxConfirmation.say([
                                        { text: 'send!, bye!', isBackchannel: true },
                                        { type: 'command', text: '/leave', delay: 1000 }
                                    ]); */
                        }).catch(e => {
                            log('error sendInvitePerSMS-------->', e);
                            ctxConfirmation.say({ type: 'command', text: '/leave', delay: 2000 });
                        });
                    } else {
                        await ctxConfirmation.say({ text: 'ok, bye!', isBackchannel: true });
                        await ctxConfirmation.say({ type: 'command', text: '/leave', delay: 1000 });
                    }
                });
            } catch (e) {
                log('error', e);
                await c.say({ text: 'sorry, error occured. check smsbot logs. bye!', isBackchannel: true });
                await c.say({ type: 'command', text: '/leave', delay: 1000 });
            }
        } else {
            await c.say({ text: `${organization.displayName} does not have SMS integration active`, isBackchannel: true });
            await c.say({ type: 'command', text: '/leave', delay: 1000 });
        }
    } else {
        await c.say({ text: `Sorry ${activeAdmin.name}, it seems you do have enought rights`
            + `to send sms messages in behalve of organization ${organization.displayName}`,
        isBackchannel: true });
        await c.say({ type: 'command', text: '/leave', delay: 1000 });
    }
});

// Start Express.js webhook server to start listening
// when on localhost
if (process.env.NODE_ENV === 'development') {
    log('starting localhost bot');
    bot.start();
}
exports.cloudfunction = bot.router({ async: true });
