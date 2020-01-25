const validateOptions = require('schema-utils')
const schema = require('../schema.json')
const { getVisualforceHooks } = require('./hooks');
const { getResourceBundleInfo, createMetaData } = require('./helper')
const { compareCache } = require('./cache')
const { readFiles, modifyFiles, writeFiles } = require('./asyncFile')

const PLUGIN_NAME = 'Visualforce-Template-Webpack-Plugin';

class VisualforceWebpackPlugin {

    constructor(options) {
        // validate options
        validateOptions(schema, options, {
            name: PLUGIN_NAME,
            baseDataPath: 'options',
          });
        this.options = options;
        this.cache = {};
    }

    /**
     * 
     * @param {WebpackCompilation} compilation
     * @returns {VisualforceTemplateWebpackPluginHooks} Hooks
     */
    static getHooks(compilation) {
        return getVisualforceHooks(compilation)
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync(PLUGIN_NAME, (compilation, callback) => {
            const { options: { output } } = compiler;
            const stats = compilation.getStats();
            const { compilation: { entrypoints } } = stats;

            const staticResInfo = getResourceBundleInfo(output);
            const pluginMetaData = createMetaData(this.options,  entrypoints);

            const { memoryCache, runMetaData, run } = compareCache(this.cache, pluginMetaData)

            if(run) {
                this.cache = memoryCache;
                this.dispatchAssets(staticResInfo, runMetaData);
            }
            callback();
        })
    }

    async dispatchAssets(staticResInfo, pluginMetaData) {
        try {
            // read files for each config
            const fileObjects = await readFiles(pluginMetaData); 
            // modify each file
            const modifiedFiles = await modifyFiles(fileObjects, pluginMetaData, staticResInfo);
            // write files
            await writeFiles(modifiedFiles)

        } catch(err) {
            console.error(`\n${PLUGIN_NAME} had a runtime error: \n`, err);
        }
    }   
}



module.exports = VisualforceWebpackPlugin;