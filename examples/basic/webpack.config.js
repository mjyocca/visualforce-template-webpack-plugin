const path = require('path')
const VisualforcePlugin = require('visualforce-template-webpack-plugin')

module.exports = {
    entry: 'index.js',
    output: {
        filename: '[name].bundle.js',
        output: path.resolve(__dirname, './force-a[[/main/default/staticresources/dist')
    },
    plugins: [
        new VisualforcePlugin({
            entry: 'main',
            page: path.resolve(__dirname, './force-app/main/default/pages/App.page')
        })
    ]
}