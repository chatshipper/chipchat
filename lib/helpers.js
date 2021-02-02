const debug         = require('debug')('chipchat:helpers');
/**
   Get merged configuration of instance tree of an organization.
   @param {orgpath} string - Organization path
*/
const getInstanceConfig = async (api, orgpath) => {
    if (!api.auth.user) {
        api.emit('error', { type: 'botinstance', message: 'Need to have authentication...' });
        return { status: 'missing bot auth' };
    }
    const orgs = orgpath.split('#');
    const orgId = orgs.last;
    debug(`getInstanceConfig: ${orgId}: find bots for user ${api.auth.user}...`);
    if (api._instances[orgId]) {
        debug(`getInstanceConfig: ${orgId}: returning instance from cache`, api._instances[orgId].meta);
        return { ...api._instances[orgId] };
    }
    debug(`getInstanceConfig: ${orgId}: getting botinfo ${api.auth.user}`);
    const botinfo = await api.bots.get(api.auth.user).catch(api._handleCatch('Could not load bot info', 'bot'));
    if (!botinfo) return { status: 'bot error' };
    const defaultInstance = {
        meta: botinfo.audience === 'owner' ? botinfo.meta : {},
        enabled: botinfo.audience === 'owner' && botinfo.enabled,
        status: botinfo.audience === 'owner' ? 'active' : 'not installed'
    };
    const options = { organization: `[${orgs.join(',')}]`, sort: 'orgPath', bot: botinfo.id };
    const allInstances = orgs.map(() => ({ meta: {}, enabled: false, status: 'not installed' })); //start with disabled list
    const instances = await api.botinstances.list(options).catch(api._handleCatch('Could not load instances', 'botinstance'));
    if (!instances) return { status: 'bot instances error' };
    instances.forEach((instance) => {
        // replace allInstances element of api instance
        allInstances[instance.orgPath.split('#').length - 1] = { ...instance };
    });
    const lastInstance = allInstances.slice(-1)[0];
    if (!lastInstance.enabled) {
        // the last instance is the instance to check
        debug(`getInstanceConfig: ${orgId}: bot instance ${lastInstance.id} is not enabled, providing empty default`, defaultInstance);
        api._instances[orgId] = defaultInstance;
        return { ...defaultInstance };
    }
    const mergedMeta = {};
    allInstances.filter(i => i.enabled).forEach((instance) => {
        Object.entries(instance.meta || {}).forEach(([key, val]) => {
            if (val) {
                mergedMeta[key] = val.replace(/\ufffc/g, '').trim(); // fix strange unicode chars at end of config settings
            }
        });
    });
    debug(`getInstanceConfig: ${orgId}: updating instance config cache to:`, mergedMeta);
    api._instances[orgId] = { ...instances[0], bot: botinfo.id, meta: { ...mergedMeta } };
    return api._instances[orgId] || { meta: {}, enabled: false, status: 'not found' };
};

module.exports = {
    getInstanceConfig
};
