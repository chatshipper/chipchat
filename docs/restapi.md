## API Resources

All organization resources available through the API can be accessed by the SDK: `users`, `channels`, `contacts`, `conversations`, `messages`, `organizations`, `orggroups`, `services`, `forms`, `workflows`, `kbases`, `kbitems`, `articles` and `files`.

Each resource has the methods `list`,`get`,`create`,`update` and `delete` available to it.

<a name="list"></a>

## bot.&lt;resources&gt;.list(options, [callback])
Search a resource collection.

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | Query options |
| callback | <code>function</code> | Callback |

```
const options = {
  // reserved parameters
  sort: '-title',
  offset: 0,
  limit: 10,
  select: 'title,content',
  populate: 'organization',
  // filter parameters
  content: '~article',
  createdAt: '>2019-01-01',
  //organization: +shared?
};
bot.articles.list(options)
.then(articles => console.log(`${articles.length} articles returned`))
.catch(e => console.log(e.toString()));

bot.articles.list(options, (err, articles) => {
  if (err) {
    console.log(err.toString()
  } else {
    console.log(`${articles.length} articles returned`)
  }
});
```

<a name="get"></a>

## bot.&lt;resources&gt;.get(id, [options], [callback])
Get a specific resource.

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | Resource ID |
| options | <code>object</code> | Optional selection and population options |
| callback | <code>function</code> | Optional Callback |

<a name="create"></a>

## bot.&lt;resources&gt;.create(options, [callback])
Create a new resource.

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | New resource properties |
| callback | <code>function</code> | Callback |

```
bot.conversations.create({ messages: [{ text: 'Hi' }] })
  .then(conv => console.log('created', conv.name))
  .catch(err => console.log('created err', err.toString()));
```

Example:

    chipchat.conversations.create(
      { name: 'Review'},
      (conversation) => {
            chipchat.say(conversation.id, 'Hello!');
            chipchat.sendMessage(conversation.id, {
                type: 'command',
                text: '/notify'
            });
        }
    );

<a name="update"></a>

## bot.&lt;resources&gt;.update(options, [callback])
Update a resource.

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | Updated resource properties |
| callback | <code>function</code> | Callback |

<a name="delete"></a>

## bot.&lt;resources&gt;.delete(id, [callback])
Delete a resource.

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | Resource ID |
| callback | <code>function</code> | Callback |


### Using Promises

Every method returns a chainable promise which can be used instead of a regular callback:

```javascript
// Create a new customer and then a new charge for that customer:
chipchat.organizations.create({
    name: 'Acme',
    email: 'foo-customer@example.com'
}).then((organization) => {
    return chipchat.forms.create({
        organization: organization.id,
        name: 'Support Case'
        fields: [{ name: 'Case ID' }]
    });
}).then((form) => {
    return chipchat.conversations.create({
        organization: organization.id,
        messages: [{ type: 'form', meta: { form: form.id} }]
    });
}).then((conversation) => {
    // New conversation created with new service and form in a new organization
}).catch((err) => {
    // Deal with an error
});
```


-----------

# Restipes!

* [Introduction](/#/playbook/faq#introduction)
* [How to create a new Page on the Playbook?](//#/playbook/faq#newPage)
* [How to write a document in Markdown?](/#/playbook/faq#markdown)

## <a id="introduction" name="introduction"></a>Introduction
---

here is some Introduction text1...


## Calling the REST API

The following resources are available through the API: 'User', 'UserGroup', 'Channel', 'Contact', 'Conversation', 'Message',
'Organization', 'OrganizationGroup', 'Service', 'Form',
'Workflow', 'Metric',
'Kbase', 'Kbitem', 'Article', 'Event', 'File' and 'Location'.

Each resource  has the following methods available to it:

* get<Resource>s
* get<Resource>
* create<Resource>
* update<Resource>
* delete<Resource>

Example:

    client.createConversation({ name: 'Review'})
        .then((conversation, actions) => {
            actions.say('Hello!');
            client.sendMessage(conversation.id, {
                type: 'command',
                text: '/notify'
            });
        }
    );

sendMessage
createConversation
getUser
getChannels
getProfile


//https://github.com/stripe/stripe-node/wiki/Passing-Options

# Passing Options

Stripe's Node.js bindings allow you to pass additional options in the form of an object after the required arguments to any given method, and additional parameters for when the method's first argument is a string.
Additional Parameters

The stripe.charges.refund() (documentation) method has a single required argument: the chargeId (ID of the charge that you wish to refund). The simplest way to use this method is to pass the chargeId in as an argument:

stripe.charges.refund(chargeId);

There are additional optional arguments though:

    amount
    refund_application_fee

These are passed as an object in the second argument:

stripe.charges.refund(chargeId, {
  amount: 123,
  refund_application_fee: true
});

For methods where all arguments are optional, e.g. the stripe.events.list() method (documentation), you would simply pass them all in via an object as the first argument:

stripe.events.list({
  limit: 20,
  starting_after: 40
});

Options

All methods can accept an optional options object containing one or more of the following:

    api_key - use a different API Key for this particular request;
    idempotency_key - make your requests idempotent;
    stripe_account - authenticate as a Connected Account;
    stripe_version - use a specific/different Stripe API Version for this request;

This options object can be included as the last argument for any method:

// Just the Charge ID and an Idempotency Key:
stripe.charges.refund(chargeId, {
   idempotency_key: refundIdempotencyKey,
});

// All of the Charge ID, additional parameters, and an Idempotency Key:
stripe.charges.refund(chargeId, {
  amount: 500,
}, {
   stripe_account: connectedAccountId,
});


