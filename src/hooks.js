const { AsyncSeriesWaterfallHook } = require('tapable')

const PluginHookMap = new WeakMap();

function getVisualforceHooks(compilation) {
    let hooks = PluginHookMap.get(compilation)
    if(!hooks) {
        hooks = createPluginHooks();
        PluginHookMap.set(compilation, hooks)
    }
    return hooks;
}

function createPluginHooks() {
    return {
        alterAssets: new AsyncSeriesWaterfallHook(['args']),
        alterAssetGroups: new AsyncSeriesWaterfallHook(['args']),
        afterTemplateUpdates: new AsyncSeriesWaterfallHook(['args'])
    };
}

module.exports = {
    getVisualforceHooks
};