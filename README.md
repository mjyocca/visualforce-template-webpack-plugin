[![Latest Stable Version](https://img.shields.io/npm/v/visualforce-template-webpack-plugin.svg)](https://www.npmjs.com/package/visualforce-template-webpack-plugin)
[![NPM Downloads](https://img.shields.io/npm/dm/visualforce-template-webpack-plugin.svg)](https://www.npmjs.com/package/visualforce-template-webpack-plugin)
[![License](https://img.shields.io/github/license/mjyocca/visualforce-template-webpack-plugin.svg)](https://github.com/mjyocca/visualforce-template-webpack-plugin)

# Visualforce Template Webpack Plugin

This is a [Webpack](https://webpack.js.org/) plugin that simplifies the updating of your [Visualforce](https://developer.salesforce.com/docs/atlas.en-us.pages.meta/pages/pages_intro_what_is_it.htm) page(s)/component(s) by embedding your static resource file(s) as script and link tags. 

*More about referencing static resource files in Visualforce markup [here](https://developer.salesforce.com/docs/atlas.en-us.pages.meta/pages/pages_resources_reference.htm).*

#### Before Webpack Compilation:
**`App.page`**
```html
<apex:page>

    <!--% styles %-->
    <!--% styles %-->

    <apex:pageBlock>
    ...
    </apex:pageBlock>
    ...
    <!--% scripts %-->
    <!--% scripts %-->

</apex:page>
```

#### After Webpack Compilation:
**`App.page`**
```html
<apex:page>

    <!--% styles %-->
    <link type="text/css" rel="stylesheet" href="{!$Resource.dist, 'main.css')}" />
    <!--% styles %-->

    <apex:pageBlock>
    ...
    </apex:pageBlock>
    ...
    <!--% scripts %-->
    <script type="text/javascript" src="{!$Resource.dist, 'bundle.js')}"></script>
    <!--% scripts %-->

</apex:page>
```

<br />

# Install
```bash
npm i visualforce-template-webpack-plugin --save-dev
```

#### Read Before Moving On!

* Do not put anything between  `<!--% scripts %--><!--% scripts %-->` comment tags. They will be <span style="color:red;">erased!!</span>

<br />

# Configuration

<h3 align="">Step 1: Visualforce Template Declaration</h3>

#### In your Visualforce Page, you need to declare where you want the assets to generate.<br/>
`% scripts %` for your js files and `% styles %` for your css files
<br/>

#### Spacing does not matter
`<!--%scripts%-->`, `<!--% scripts %-->`, or `<!-- % scripts % -->`

**App.page**
```html
<apex:page>
    <head>
        <!--% styles %-->
        <!-- WARNING: Do NOT Put anything [HERE]. Will get erased -->
        <!--% styles %-->
    </head>
    <body>
        <apex:form>
            ...
        </apex:form>
        <script>
            //put non webpack/global javascript here
        </script>
        <!--% scripts %-->
        <!-- WARNING: Do NOT Put anything [HERE]. Will get erased -->
        <!--% scripts %-->
    </body>
</apex:page>
```

<h3>Step 2: Import/Require Plugin into Webpack config file</h3>

**webpack.config.js**
```js
const VisualforcePlugin = require('visualforce-template-webpack-plugin')
```


<h3>Step 3: Add a new  instance of the Imported/Required Plugin configuration </h3>

**webpack.config.js**

```js
//From Step 1
const VisualforcePlugin = require('visualforce-template-webpack-plugin')

module.exports = {
    entry: './index.js',
    output: {
        filname: '[name].bundle.js',
        path: "./force-app/main/default/staticresources/dist"
    },
    plugins: [
        // Add a new instance here
        new VisualforcePlugin({
            page: './force-app/default/main/pages/App.page'
        })
    ]
}
```

<br />

<h1 align="">Options</h1>

#### Plugin accepts `{Object}` or `{Array}` of objects w/ the following data structure

|Name|Type|Default|Required|Description|
|:--:|:--:|:-----:|:--:|:----------|
|**`entry`**|`{String} or {Array} of strings`|`main`|`false`|Name of entry configuration key name. Needs to match your webpack config entry names. Defaults to all entrypoint assets if none specified.|
|**`page`**|`{String}`|`undefined`|`true`|Relative path to your visualforce page or component file|
|**`scriptHook`**|`{Function}`|`undefined`|false|Callback function to modify `src` and other attributes on script tag|
|**`styleHook`**|`{Function}`|`undefined`|false|Function to hook into modifying attributes of link tags|

<hr />
<h3 align="center" style="">entry</h3>

*You can filter out entrypoint assets you wish to not include in the page*. 

Example: **webpack.config.js**
```js
modules.exports = {
    entry: {
        app: './app.js',
        main: './main.js',
        mobile: './mobile.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, "force-app/main/default/staticresources/dist"),
    },
    plugins: [
        new VisualforceTemplate({
            entry: ['app', 'main'],  // mobile entry is not included
            page: path.resolve(__dirname, 'force-app/main/default/pages/App.page')
        })
    ]
}
```
<hr />

<h3 align="center" style="">page</h3>
 *You can optionally update a Visualforce Component as well*

Example: **webpack.config.js**
```js
modules.exports = {
    entry: './app.js',
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, "force-app/main/default/staticresources/dist"),
    },
    plugins: [
        new VisualforceTemplate({
            page: path.resolve(__dirname, 'force-app/main/default/components/[Name].component')
        })
    ]
}
```

**`[Name].component`**
```html
<apex:component>
    <!--% scripts %-->
    <script type="text/javascript" src="{!URLFOR($Resource.dist, 'main.bundle.js')}"></script>
    <!--% scripts %-->
</apex:component>
```

<hr />
<h3 align="center" style="">scriptHook</h3>

 *Script Tag Attribute Defaults*

|Name|Default|
|:----:|:----:|
|**`type`**|`text/javascript`|
|**`src`**|`[Depends on output in static resource]`|
|**`async`**|`false`|
|**`defer`**|`false`|
|**`nomodule`**|`false`|

**How to overide defaults**:
Return an Object and setting any of the properties in the table above. Only need to include the script tag attributes you wish to change. The function is passed an object containing:



```js
scriptHook: (scriptData) => {
    const { resourceName, resourceFilePath } = scriptData;
    // ...
    return { 
        src: `${resourceName}/${resourceFilePath}`
    } 
}
```

#### examples of using the options 
```js
new VisualforcePlugin({
        entry: 'app',
        page: path.resolve(__dirname, "./force-app/default/main/pages/App.page"),
        scriptHook: ({ resourceName, resourceFilePath }) => {
            // ...
            return {
                src: `{!URLFOR($Resource.${resourceName}, '${resourceFilePath}')}`,
                type: 'text/javascript'
            }
        }
    })
```

<hr/>

<h3 align="center" style="">styleHook</h3>

*Style Tag Attribute Defaults*
<!-- #### Style Tag Attribute Defaults -->

|Name|Default|
|:----:|:----:|
|**`rel`**|`stylesheet`|
|**`href`**|`[Depends on output in static resource]`|
|**`type`**|`text/css`|

**How to overide defaults**:
Return an Object and setting any of the properties in the table above. Only need to include the script tag attributes you wish to change. The function is passed an object containing:

```js
new VisualforcePlugin({
        entry: 'app',
        page: path.resolve(__dirname, "./force-app/default/main/pages/App.page"),
        styleHook: ({ resourceName, resourceFilePath }) => {
            return {
                rel: 'stylesheet',
                href: ``,
                type: ''
            };
        }
})
```
<br />

<h1>Example(s)</h1>

[View More Examples Here](https://github.com/mjyocca/visualforce-template-webpack-plugin/tree/master/examples)

**webpack.config.js**
```js
const path = require('path')
const VisualforcePlugin = require('visualforce-template-webpack-plugin')

module.exports = {
    entry: {
        app: './index.js'
    },
    output: {
        filename: 'bundle.js'
        path: path.resolve(__dirname, "./force-app/main/default/staticresources/dist")
    },
    plugins: [
        new VisualforcePlugin({
            entry: 'app',
            page: './force-app/default/main/pages/App.page'
        })
    ]
}
```
#### Before:
**App.page**
```html
<apex:page>
    <apex:pageBlock>
    ...
    </apex:pageBlock>
    ...
    <!--% scripts %-->
    <!--% scripts %-->
</apex:page>
```

#### After:
**App.page**
```html
<apex:page>
    <apex:pageBlock>
    ...
    </apex:pageBlock>
    ...
    <!--% scripts %-->
    <script type="text/javascript" src="{!$Resource.dist, 'bundle.js')}"></script>
    <!--% scripts %-->
</apex:page>
```

---
## Updating Multiple Visualforce File(s)

example of updating more than one visualforce page/component w/ multiple entries

***webpack.config.js***
```js
const path = require('path')
const VisualforcePlugin = require('visualforce-template-webpack-plugin')

module.exports = {
    entry: {
        app: './app.js',
        admin: '/admin.js',
        mobile: './admin.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, "./force-app/main/default/staticresources/dist")
    },
    plugins: [
        new VisualforcePlugin([{   
                entry: 'app',
                page: path.resolve(__dirname, "./force-app/main/default/pages/App.page") 
            },
            {
                entry: 'admin',
                page: path.resolve(__dirname, "./force-app/main/default/pages/Admin.page")
            },
            {
                entry: 'mobile',
                page: path.resolve(__dirname, "./force-app/main/default/pages/AppSf1.page")
        }])
    ]
}
```