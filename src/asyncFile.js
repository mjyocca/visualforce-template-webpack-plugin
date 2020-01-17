const fs = require('fs');
const path = require('path');
const { createNewPage } = require('./dom');

const readFileAsync = (fileName, page, enc) => {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, enc, function(err, data){
            if(err) 
                reject(err);
            else 
                resolve({ fileName, page, data });
        })
    })
}

 /**
  * 
  * @param {*} pluginData 
  */
 const readFiles = (pluginData) => {
    const readAllFiles = pluginData.map((data) => {
        const { page } = data;
        return readFileAsync(path.resolve(page), page, 'utf8').catch((e) => e);
    })
    return Promise.all(readAllFiles)
}


const modifyFileAsync = (page, data, metaData, staticResourceOpts) => {
    return new Promise((resolve, reject) => {
        try {
            const newPage = createNewPage(data, metaData, staticResourceOpts)
            resolve({ newPage, fileName: page })
        } catch(err) {
            reject(err)
        }
    })
}

/**
 * 
 * @param {*} fileObjects 
 * @param {*} metaDataObjects 
 * @param {*} staticResInfo 
 */
const modifyFiles = (fileObjects, metaDataObjects, staticResInfo) => {
    const modifyAllFiles = fileObjects.map(fileObject => {
        const { page, data } = fileObject;
        const currentMetaData = metaDataObjects.find(md => md.page === page);
        return modifyFileAsync(page, data, currentMetaData, staticResInfo)
    })  
    return Promise.all(modifyAllFiles)
}


const writeFileAsync = (fileName, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(fileName, data, (err) => {
            if(err) 
                reject(err)
            else
                resolve();
        })
    })
}

/**
 * 
 * @param {*} files 
 */
const writeFiles = (files) => {
    const writeAllFiles = files.map(({fileName, newPage}) => {
        return writeFileAsync(fileName, newPage);
    })
    return Promise.all(writeAllFiles)
}


module.exports = {
    readFiles,
    modifyFiles,
    writeFiles
};