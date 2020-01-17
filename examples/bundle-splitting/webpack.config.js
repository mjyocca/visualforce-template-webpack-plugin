const path = require('path')
const VisualforcePlugin = require('visualforce-template-webpack-plugin')

module.exports = {
    mode: 'development',
    entry: 'index.js',
    output: {
        filename: '[name].bundle.js',
        output: path.resolve(__dirname, './force-a[[/main/default/staticresources/dist')
    },
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    },
    plugins: [
        new VisualforcePlugin({
            entry: 'main',
            page: path.resolve(__dirname, './force-app/main/default/pages/App.page')
        })
    ]
}