const cheerio = require('cheerio');
const { accumulateFiles } = require('./helper')

let $;

const configDefaults = {
    scriptComment: '%scripts%',
    linkComment: '%css%'
}

const createNewPage = (data, metaData, staticResourceOpts) => {
    let visualforce = parseHTML(data);
    visualforce = modifyHTML(metaData, staticResourceOpts);
    return visualforce.html();
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

const modifyHTML = (pluginData, staticResourceOpts) => {
    const { scriptComment, linkComment } = configDefaults;
    const virtualCommentInfo = queryComment({commentTag: scriptComment});
    const virtualCssInfo = queryComment({commentTag: linkComment});
    const { assets } = pluginData;
    const { css, js } = accumulateFiles(assets);
    //insert script tags
    generateReferenceTags({ virtualDomInfo: virtualCommentInfo, staticResOpts: staticResourceOpts, files: js, pluginData });
    //insert link tags 
    generateReferenceTags({ virtualDomInfo: virtualCssInfo, staticResOpts: staticResourceOpts, files: css, pluginData });
    //return modfied virtualized dom
    return $;
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
    const commentTags = $("*").contents().filter(function () {
        return this.nodeType === 8 && this.data === commentTag;
    });
    const startingPoint = commentTags[0];
    const endNode = commentTags[0];
    const whiteSpace = (startingPoint.prev && startingPoint.prev.data) ? startingPoint.prev.data : `\n     `;
    return { startingPoint, endNode, whiteSpace }
}

const getCommentWhiteSpace = (str) => str.substr(str.lastIndexOf('\n') + 1, str.length);

const nextUntil = (nodes, currentNode, endNode) => {
    if(currentNode.type !== 'comment') {
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
        : `${createLinkElement(whiteSpace, resourceName, resourceFilePath, pluginData.linkHook) + lastOne}`;
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

const createLinkElement = (whiteSpace, resourceName, resourceFilePath, linkHook) => {
    let defaultConfig = {
        rel: 'stylesheet',
        href: (resourceName) ? `{!URLFOR($Resource.${resourceName}, '${resourceFilePath}')}` : `{!$Resource.${resourceFilePath.split('.')[0]}}`,
        type: 'text/css'
    };
    if(linkHook && typeof linkHook == 'function') {
        let override = linkHook({resourceName, resourceFilePath});
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
    modifyHTML ,
    createNewPage
}