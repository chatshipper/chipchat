const debug = require('debug')('chipchat:helpers');
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
    const [orgId] = orgs.slice(-1);
    const cacheKey = orgId + api.auth.user;
    if (api.cache.get(cacheKey)) {
        return api.cache.get(cacheKey);
    }
    debug(`getInstanceConfig: ${orgId}: find bots for user ${api.auth.user}...`);
    const botinfo = await api.bots.get(api.auth.user).catch(api._handleCatch('Could not load bot info', 'bot'));
    if (!botinfo) return { meta: {}, enabled: false, status: 'bot error' };
    const options = { organization: `[${orgs.join(',')}]`, sort: 'orgPath', bot: botinfo.id };
    const allInstances = orgs.map(() => ({ id: 'default', meta: {}, enabled: false, status: 'not installed' })); //start with disabled list
    const instances = await api.botinstances.list(options).catch(api._handleCatch('Could not load instances', 'botinstance'));
    if (!instances) return { meta: {}, enabled: false, status: 'bot instances error' };
    instances.forEach((instance) => {
        // replace allInstances element of api instance
        allInstances[instance.orgPath.split('#').length - 1] = { ...instance };
    });
    const [lastInstance] = allInstances.slice(-1);
    const mergedMeta = { ...botinfo.meta }; //start with bot meta
    //merge bot instances metas if enabled
    allInstances.filter(i => i.enabled).forEach((instance) => {
        Object.entries(instance.meta || {}).forEach(([key, val]) => {
            if (val) {
                mergedMeta[key] = val.replace(/\ufffc/g, '').trim(); // fix strange unicode chars at end of config settings
            }
        });
    });
    const config = {
        ...botinfo,
        ...lastInstance,
        enabled: botinfo.status === 'active' && botinfo.enabled && lastInstance.enabled,
        bot: botinfo.id, //backward comp
        meta: {
            ...mergedMeta
        }
    };
    api.cache.put(cacheKey, config)
    debug(`getInstanceConfig: ${orgId}: returning config:`, config);
    return config;
};

module.exports = {
    getInstanceConfig
};
