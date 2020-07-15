import { AsyncSeriesWaterfallHook } from 'tapable';
import * as webpack from 'webpack';

const PluginHookMap = new WeakMap();

export function getVisualforceHooks(compilation: webpack.compilation.Compilation): any {
    let hooks = PluginHookMap.get(compilation)
    if (!hooks) {
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
