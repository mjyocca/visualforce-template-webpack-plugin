const compareCache = (memoryCache, pluginData) => {
    const runMetaData = [];
    for(const data of pluginData) {
        const { page, assets } = data;
        // set memory cache key to generated assets
        if(!memoryCache[page]) {
            memoryCache[page] = assets;
            runMetaData.push(data)
        // assets have changed update cache and add to pluginData to update that config
        } else if(JSON.stringify(assets) !== JSON.stringify(memoryCache[page])) {
            memoryCache[page] = assets;
            runMetaData.push(data);
        }
    }
    const run = runMetaData.length > 0;
    return { memoryCache, runMetaData, run }
}

module.exports = { 
    compareCache
};