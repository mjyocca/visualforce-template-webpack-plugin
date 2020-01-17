# Visualforce Template Webpack Plugin

This is a [Webpack](https://webpack.js.org/) plugin that simplifies the updating of your [Visualforce](https://developer.salesforce.com/docs/atlas.en-us.pages.meta/pages/pages_intro_what_is_it.htm) pages by automatically including your static resource file(s) references as script and link tags. More about referencing static resource files in Visualforce markup [here](https://developer.salesforce.com/docs/atlas.en-us.pages.meta/pages/pages_resources_reference.htm).

# Install
```bash
npm i visualforce-template-webpack-plugin --save-dev
```

### Read Before Moving On!
<!-- * Backup your visualforce pages w/ git or some other tracking mechanizm before conducting a test run.
A lof of html parsing engines do not like the apex namespace tags. Fortunately the one used in this plugin respects the non standard html tags. 
* A lot of admins and devs rely on sandbox development where the org is the source of truth, which is the reason for these warnings. -->
* Do not put anything between  `<!--%scripts%--><!--%scripts%-->` comment tags. They will be <span style="color:red;">erased!!</span>
# Usage
Since Visualforce has server side templating and a lot of your source needs to be placed inline w/ in your page, integrating with modern javascript tooling becomes cumbersome. 


# Configuration

<h3>Step 1: Import/Require Plugin into Webpack config file</h3>

**webpack.config.js**
```js
const VisualforcePlugin = require('visualforce-template-webpack-plugin')
```

<h3 align="">Step 2: Visualforce Template Declaration</h3>

#### In your Visualforce Page, you need to declare where you want the assets to autopopulate.<br/>
`%scripts%` for your js files and `%css%` for your css files
<br/>

**App.page**
```html
<apex:page>
    <head>
        <!--%css%-->
        <!-- WARNING: Do NOT Put anything [HERE]. Will get erased -->
        <!--%css%-->
    </head>
    <body>
        <apex:form>
            ...
        </apex:form>
        <script>
            //put non webpack/global javascript here
        </script>
        <!--%scripts%-->
        <!-- WARNING: Do NOT Put anything [HERE]. Will get erased -->
        <!--%scripts%-->
    </body>
</apex:page>
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


<h1 align="">Options</h1>

#### Plugin accepts `{Object}` or `{Array}` of objects w/ the following data structure

|Name|Type|Default|Required|Description|
|:--:|:--:|:-----:|:--:|:----------|
|**`entry`**|`{String} or {Array}`|`main`|`false`|Name of entry configuration key name. Needs to match your webpack config|
|**`page`**|`{String}`|`undefined`|`true`|Relative path to your visualforce page or component file|
|**`scriptHook`**|`{Function}`|`undefined`|false|Callback function to modify `src` and other attributes on script tag|
|**`linkHook`**|`{Function}`|`undefined`|false|Function to hook into modifying attributes of link tags|


<h2 align="center">Script Function Hooks Details</h2>

#### Script Tag Attribute Defaults

|Name|Default|
|:----:|:----:|
|**`type`**|`text/javascript`|
|**`src`**|`[Depends on output in static resource]`|
|**`async`**|`false`|
|**`defer`**|`false`|
|**`nomodule`**|`false`|

**Example**: `<script type="text/javascript" src="[]" />` <br/><br/>
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
                src: `{!URLFOR($Resource.${root}, '${fileName}')}`
                type: 'text/javascript'
            }
        }
    })
```

```js
new VisualforcePlugin({
        entry: 'app',
        page: path.resolve(__dirname, "./force-app/default/main/pages/App.page"),
        linkHook: ({ resourceName, resourceFilePath }) => {
            return {
                rel: 'stylesheet',
                href: ``,
                type: ''
            };
        }
})
```

<h1 align="center">Example(s)</h1>


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
    <!--%scripts%-->
    <!--%scripts%-->
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
    <!--%scripts%-->
    <script type="text/javascript" src="{!$Resource.dist, 'bundle.js')}"></script>
    <!--%scripts%-->
</apex:page>
```
---
## Bundle Splitting

if your entry point has code/bundle splitting 
then your page might result in

```html
<apex:page>
    <apex:pageBlock>
    </apex:pageBlock>
    ...
    <!--%scripts%-->
    <script type="text/javascript" src="{!$Resource.dist, 'polyfill.js')}"></script>
    <script type="text/javascript" src="{!$Resource.dist, 'vendor.js')}"></script>
    <script type="text/javascript" src="{!$Resource.dist, 'bundle.js')}"></script>
    <!--%scripts%-->
</apex:page>
```
---
## Updating Multiple Visualforce File(s)

example of updating more than one visualforce page w/ multiple entries

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
---
## Outputting File(s) directly nested w/ in `force-app/main/default/staticresources/` directory. (Not recommended)
If your output combination of your path and filename is only one level deep w/ in staticresources then your file name(s) need to change from any characters such as `.` to underscrores `_` since salesforce doesn't allow non alphanumeric characters in the file name

W/ this config
change the following
```js
output: {
    filename: '[name].bundle.js'
    path: path.resolve(__dirname, "force-app/main/default/staticresources/")
}
```

to
```js
output: {
    filename: '[name]_bundle.js'
    path: path.resolve(__dirname, "force-app/main/default/staticresources/")
}
```
or

```js
output: {
    filename: '[name]_bundle.resource'
    path: path.resolve(__dirname, "force-app/main/default/staticresources/")
}
```


If your splitting chunks as well you'll want to do the following in your optimization

```js
optimization: {
    splitChunks: {
        chunks: 'all',
        entry: (module, chunks, cacheGroupKey) => {
                const moduleFileName = module.identifier().split('/').reduceRight(item => item);
                const allChunksNames = chunks.map((item) => item.name).join('_');
                return `${cacheGroupKey}_${moduleFileName.split('.')[0]}`.split('-').join(''); 
        }
    }
}
```

for example if your using react, react-dom split bundle might result in `vendors_reactdom_bundle.js`;



## Ngrok/Development Hook Example

Handy if you want to implement a dev config w/ live updating w/ out refreshing the visualforce page

```js
new VisualForceTemplatePlugin({
    entry: 'main',
    page: './force-app/main/default/pages/App.page',
    scriptHook: (scriptData) => {
        const { resourceName, resourceFilePath } = scriptData;
        return {
            src: `https://mjyocca.ngrok.io/${resourceName}/${resourceFilePath}`,
        }
    }
))
```

Output **App.page**
```html
<!--%scripts%-->
<script type="text/javascript" src="https://mjyocca.ngrok.io/vendors_admin~main_react_dom/vendors_admin~main_react_dom.bundle.js"></script>
<script type="text/javascript" src="https://mjyocca.ngrok.io/main/main.bundle.js"></script>
<!--%scripts%-->
```

vs

```html
<!--%scripts%-->
<script type="text/javascript" src="{!URLFOR($Resource.vendors_admin~main_react_dom, 'vendors_admin~main_react_dom.bundle.js')}" ></script>
<script type="text/javascript" src="{!URLFOR($Resource.main, 'main.bundle.js')}"></script>
<!--%scripts%-->
```