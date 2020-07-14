const cheerio = require('cheerio');
const { accumulateFiles } = require('./helper')

let $;

const configDefaults = {
    scriptComment: '% scripts %',
    linkComment: '% styles %'
}

const createNewPage = (data, metaData, staticResourceOpts) => {
    // parse vf page into ast via cheerio
    parseHTML(data);
    // modify ast and determine if we should commit the file
    const { commitFile } = modifyHTML(metaData, staticResourceOpts);
    // return modified html and if we should commit to disk
    return {
        newPage: $.html(),
        commitFile
    };
}

const parseHTML = (page) => {
    $ = cheerio.load(page, {
        decodeEntities: false,
        lowerCaseTags: false,
        lowerCaseAttributeNames: false,
        recognizeSelfClosing: true,
        xmlMode: true
    });
    return $;
}

const removeWhiteSpace = (str) => {
    return str.split(' ').join('');
}

const modifyHTML = (pluginData, staticResourceOpts) => {
    const { scriptComment, linkComment } = configDefaults;
    const commentTagNodeJs = queryComment({commentTag: removeWhiteSpace(scriptComment.trim()) });
    const commentTagNodeCss = queryComment({commentTag: removeWhiteSpace(linkComment.trim()) });
    const { assets } = pluginData;
    const { css, js } = accumulateFiles(assets);
    // if we found anchor comment tags, insert script tags
    if(commentTagNodeJs) {
        generateReferenceTags({ virtualDomInfo: commentTagNodeJs, staticResOpts: staticResourceOpts, files: js, pluginData });
    }
    // if we found anchor comment tags, insert link tags 
    if(commentTagNodeCss) {
        generateReferenceTags({ virtualDomInfo: commentTagNodeCss, staticResOpts: staticResourceOpts, files: css, pluginData });
    }

    const commitFile = (commentTagNodeJs != undefined || commentTagNodeCss != undefined);
    //return modfied virtualized dom
    return {
        commitFile: commitFile
    }
}

const staticResHelper = ({ file, staticResourceDir, appendedFileFolders }) => {
    const splitFileArray = file.split('/');
    let resourceName;
    let resourceFilePath = file;
    //if static resource directory name is undefined from path //split the file name and set first directory as resource name
    if(!staticResourceDir && splitFileArray.length > 1){
        const splitFileArray = file.split('/');
        resourceName = splitFileArray.shift();
        resourceFilePath = splitFileArray.join('/');
    } else {
        resourceName = staticResourceDir;
    }
    //nested folder structure add to script file name path
    if(appendedFileFolders) resourceFilePath = `${appendedFileFolders}/${resourceFilePath}`;
    return { resourceName, resourceFilePath }
};


const queryComment = ({ commentTag }) => {
    const [ startingPoint, endNode ] = $("*").contents().filter(function() {
        return this.nodeType === 8 && removeWhiteSpace(this.data.trim()) === commentTag;
    }).toArray();

    let safeToRun = startingPoint && endNode;
    
    if(startingPoint && !endNode) {
        console.log(`\nvisualforce-template-webpack-plugin: missing the other <!-- ${commentTag} --> comment tag in visualforce page\n`);
        return;
    }

    if(!safeToRun) {
        console.log(`\nvisualforce-template-webpack-plugin: <!-- ${commentTag} --> was not defined in visualforce page\n`)
        return;
    }
    const whiteSpace = (safeToRun && startingPoint.prev && startingPoint.prev.data) ? startingPoint.prev.data : `\n     `;
    return { startingPoint, endNode, whiteSpace }
}

const getCommentWhiteSpace = (str) => str.substr(str.lastIndexOf('\n') + 1, str.length);

const nextUntil = (nodes, currentNode, endNode) => {
    if(currentNode.type !== 'comment' && currentNode !== endNode) {
        nodes.push(currentNode);
        nextUntil(nodes, currentNode.next, endNode);
    }
}

const removePrevTextNodes = (startNode, endNode) => {
    const nodes = [];
    nextUntil(nodes, startNode.next, endNode);
    for(const [i, node] of nodes.entries()) {
        $(node).remove();
    }
}

const generateReferenceTags = ({ virtualDomInfo, staticResOpts, files, pluginData }) => {
    const { startingPoint, endNode, whiteSpace } = virtualDomInfo;
    const { staticResourceDir, appendedFileFolders } = staticResOpts;
    removePrevTextNodes(startingPoint, endNode);
    let templateStr = '';
    for(const [index, file] of files.entries()) {
        const lastOne = files.length === index + 1 ? `\n${getCommentWhiteSpace(whiteSpace)}` : '';
        const { resourceName, resourceFilePath } = staticResHelper({ file, staticResourceDir, appendedFileFolders })
        templateStr += (resourceFilePath.endsWith('.js'))
        ? `${createScriptElement(whiteSpace, resourceName, resourceFilePath, pluginData.scriptHook) + lastOne}`
        : `${createLinkElement(whiteSpace, resourceName, resourceFilePath, pluginData.styleHook) + lastOne}`;
    }
    $(startingPoint).after(templateStr);
}

const createScriptElement = (whiteSpace, resourceName, resourceFilePath, scriptHook) => {
    let defaultConfig = {
        nomodule: false,
        async: false,
        defer: false,
        src: (resourceName) ? `{!URLFOR($Resource.${resourceName}, '${resourceFilePath}')}` : `{!$Resource.${resourceFilePath.split('.')[0]}}`,
        type: "text/javascript"
    };
    if(scriptHook && typeof scriptHook == 'function') {
        let override = scriptHook({resourceName, resourceFilePath});
        defaultConfig = {
            ...defaultConfig,
            ...override
        };
    }
    whiteSpace = getCommentWhiteSpace(whiteSpace);
    return `\n${whiteSpace}<script ${defaultConfig.async == true ? 'async="async"' : '' } ${defaultConfig.defer == true ? 'defer="defer"' : ''} ${defaultConfig.nomodule == true ? 'nomodule="nomodule"' : ''} type="${defaultConfig.type}" src="${defaultConfig.src}"></script>`;
};

const createLinkElement = (whiteSpace, resourceName, resourceFilePath, styleHook) => {
    let defaultConfig = {
        rel: 'stylesheet',
        href: (resourceName) ? `{!URLFOR($Resource.${resourceName}, '${resourceFilePath}')}` : `{!$Resource.${resourceFilePath.split('.')[0]}}`,
        type: 'text/css'
    };
    if(styleHook && typeof styleHook == 'function') {
        let override = styleHook({resourceName, resourceFilePath});
        defaultConfig = {
            ...defaultConfig,
            ...override
        };
    }
    whiteSpace = getCommentWhiteSpace(whiteSpace);
    return `\n${whiteSpace}<link rel="${defaultConfig.rel}" type="${defaultConfig.type}" href="${defaultConfig.href}" />`;
};

module.exports = { 
    parseHTML, 
    modifyHTML,
    createNewPage
}