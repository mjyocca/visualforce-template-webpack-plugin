
export interface PluginOptions {
    /**
     * (Optional) Webpack entry name
     * Default: 'main' or all bundles emitted from webpack
     * Example: 'app' | ['app'] | ['app', 'admin']
     */
    entry?: string | string[];
    /**
     * (Required) path to the visualforce page or component to update
     */
    page: string;
    /**
     * (Optional) Callback to modify generated script tag attributes
     */
    scriptHook?: (resourceInfo: HookArgument) => ScriptHookReturn;
    /**
     * (Optional) Callback to modify generated link tag attributes
     */
    styleHook?: (resourceInfo: HookArgument) => StyleHookReturn;
}

interface HookArgument {
    resourceName: string;
    resourceFilePath: string;
}

interface ScriptHookReturn {
    type?: string;
    src?: string;
    async?: boolean;
    defer?: boolean;
    nomodule?: boolean;
}

interface StyleHookReturn {
    rel?: string;
    href?: string;
    type?: string;
}