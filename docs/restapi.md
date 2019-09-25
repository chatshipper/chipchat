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

```
bot.forms.get('5d8aa90d8656c44b820e8690', (err, form) => {
  if (err) {
    console.log(err.toString()
  } else {
    console.log(`form ${form.name} returned`)
  }
});
```

<a name="create"></a>

## bot.&lt;resources&gt;.create(options, [callback])
Create a new resource.

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | New resource properties |
| callback | <code>function</code> | Callback |

Example:
```
bot.conversations.create(
    { name: 'Review', messages: [{ text: 'start' }] },
    (err, conversation) => {
        if (!err) {
            bot.send(conversation.id, {
                type: 'command',
                text: '/notify'
            });
        }
    }
);
```
<a name="update"></a>

## bot.&lt;resources&gt;.update(id, options, [callback])
Update a resource.

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | Resource ID |
| options | <code>object</code> | Updated resource properties |
| callback | <code>function</code> | Callback |
```
bot.organizations.update(
    '5d840de6bd445020c70e6d64',
    { tags: ["prime"] },
    (err, organization) => {
        if (!err) {

        }
    }
);
```
<a name="delete"></a>

## bot.&lt;resources&gt;.delete(id, [callback])
Delete a resource.

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | Resource ID |
| callback | <code>function</code> | Callback |
```
bot.services.delete(
    '5d5d4a4fdf0f7d57f15325be',
    (err) => {
        if (!err) {

        }
    }
);
```

### Using Promises

Every method returns a chainable promise which can be used instead of a regular callback. Simple example:
```
bot.conversations.create({ messages: [{ text: 'Hi' }] })
  .then(conv => console.log('created', conv.name))
  .catch(err => console.log('created err', err.toString()));
```
Here's an example of chaining the creation of multiple resources:

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
