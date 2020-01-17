/**
 * 
 * @param {*} entrypoints - webpack entrypoints object
 * @returns returns js and css files for each webpack entry point
 */
const webpackBundleReducer = (entrypoints) => {
    const entryData = {};
    for (const [ entry, entrypoint] of entrypoints) {
        // check if config has entrypoint configured
          const tempFiles = entrypoint.getFiles()
            .reduce((acc, file) => {
                if(file.endsWith('.js')) {
                  acc.js.push(file)
                } else if(file.endsWith('.css')) {
                  acc.css.push(file)
                } 
                return acc
              }, 
              { css: new Array(), js: new Array() }
          )
          entryData[entry] = tempFiles
    }
    return entryData;
}

/**
 * 
 * @param {*} pluginOptions 
 * @param {*} entrypoints 
 * @returns {*} object w/ { page, entryPoints, assets }
 */
const createMetaData = (pluginOptions, entrypoints) => {
	const webpackEntryNames = Array.from(entrypoints.keys())
	const webpackEntryFiles = webpackBundleReducer(entrypoints);
	const metaData = pluginOptions
		// reduce config options by unique page name
		.reduce(uniquePageReducer, [])
		// add new assets property containing entrypoint files
		.map((pluginOption) => {
			const config = setupConfig(pluginOption, webpackEntryNames)
			const { entryPoints } = config;
			const assets = {};
			// only add unique entry point files
			entryPoints.forEach((entry) => { if(webpackEntryFiles[entry]) assets[entry] = webpackEntryFiles[entry] });
			// return new object w/ new assets property
			return { ...config, assets }
		})
	// return new Array of metadata objects
	return metaData;
}


const uniquePageReducer = (acc, current) => {
	const x = acc.find(item => item.page === current.page);
	if(!x) {
		return acc.concat([current]);
	} else {
		return acc;
	}
}

const filterDuplicates = (files) => {
    return files.filter((item, index) => {
        return files.indexOf(item) === index;
    })
}

/**
 * 
 * @param {*} assets 
 */
const accumulateFiles = (assets) => {
    let jsFiles = [];
    let cssFiles = [];
    for(const [entry, value] of Object.entries(assets)) {
        const { css, js } = value;
        jsFiles.push(js)
        cssFiles.push(css);
    }
    jsFiles = jsFiles.reduce((acc, val) => acc.concat(val), []);
    cssFiles = cssFiles.reduce((acc, val) => acc.concat(val), []);
    return {
        js: filterDuplicates(jsFiles),
        css: filterDuplicates(cssFiles)
    }
}

/**
 *
 * 
 * @param {*} config 
 * @param {*} webpackEntryNames 
 */
const setupConfig = (config, webpackEntryNames) => {
	if(!Array.isArray(config)) config = [ config ]; 
	return config.reduce((obj, currentConfig) => {
		let { entry: entryPoints } = currentConfig;
		// If entry is not specified in plugin config
		// set to current entrypoint compilation
		if(!entryPoints) entryPoints = webpackEntryNames;
		// If entry is not in array add to a new array
		if(!Array.isArray(entryPoints)) entryPoints = [entryPoints];
		// return object w/ modified entryPoints
		return { ...currentConfig, entryPoints };
  }, {});	
}

/**
 * 
 * @param {*} output - Webpack output from configuration
 */
const getResourceBundleInfo = (output) => {
  const {path, filename} = output;
  const pathArray = path.split('/');
  const statResIndex = pathArray.findIndex((el) => el == 'staticresources') + 1;
  const staticResourceDir = pathArray[statResIndex];
  const appendedFileFolders = pathArray.splice(statResIndex + 1).join('/');
  return { staticResourceDir, appendedFileFolders, filename };
}

//const isEmptyObj = (obj) => obj && Object.entries(obj).length !== 0;

module.exports = { 
	getResourceBundleInfo, 
	createMetaData, 
	accumulateFiles
};