import * as webpack from 'webpack';
import { PluginOptions } from './types/plugin.types';
import { getVisualforceHooks } from './hooks';
import { getResourceBundleInfo, createMetaData } from './helper';
import { compareCache } from './cache';
import { readFiles, modifyFiles, writeFiles } from './asyncFile';

export default class VisualforceWebpackPlugin {

    private readonly PLUGIN_NAME = 'Visualforce-Template-Webpack-Plugin';
    options: PluginOptions | PluginOptions[];
    cache: any;


    constructor(options?: PluginOptions | PluginOptions[]) {
        this.options = options;
        this.cache = {};
    }

    /**
     * 
     * @param {WebpackCompilation} compilation
     * @returns {VisualforceTemplateWebpackPluginHooks} Hooks
     */
    static getHooks(compilation: webpack.compilation.Compilation): any {
        return getVisualforceHooks(compilation)
    }

    apply(compiler: webpack.Compiler): void {
        compiler.hooks.emit.tapAsync(this.PLUGIN_NAME, (compilation, callback) => {
            const { options: { output } } = compiler;
            const stats = compilation.getStats();
            const { compilation: { entrypoints } } = stats;

            const staticResInfo = getResourceBundleInfo({
                outputPath: output.path,
                outputFileName: output.filename
            });

            const pluginMetaData = createMetaData(this.options, entrypoints);

            const { memoryCache, runMetaData, run } = compareCache(this.cache, pluginMetaData)

            if (run) {
                this.cache = memoryCache;
                this.dispatchAssets(staticResInfo, runMetaData);
            }
            callback();
        })
    }

    // eslint-disable-next-line
    async dispatchAssets(staticResInfo, pluginMetaData): Promise<void> {
        try {
            // read files for each config
            const fileObjects = await readFiles(pluginMetaData);
            // modify each file
            const modifiedFiles = await modifyFiles(fileObjects, pluginMetaData, staticResInfo);
            // write files
            await writeFiles(modifiedFiles as any);
        } catch (err) {
            console.error(`\n${this.PLUGIN_NAME} had a runtime error: \n`, err);
        }
    }
}



// module.exports = VisualforceWebpackPlugin;