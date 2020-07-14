

## Bundle Splitting

if your entry point has code/bundle splitting 
then your page might result in

```html
<apex:page>
    <apex:pageBlock>
    </apex:pageBlock>
    ...
    <!--% scripts %-->
    <script type="text/javascript" src="{!$Resource.dist, 'polyfill.js')}"></script>
    <script type="text/javascript" src="{!$Resource.dist, 'vendor.js')}"></script>
    <script type="text/javascript" src="{!$Resource.dist, 'bundle.js')}"></script>
    <!--% scripts %-->
</apex:page>
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
<!--% scripts %-->
<script type="text/javascript" src="https://mjyocca.ngrok.io/vendors_admin~main_react_dom/vendors_admin~main_react_dom.bundle.js"></script>
<script type="text/javascript" src="https://mjyocca.ngrok.io/main/main.bundle.js"></script>
<!--% scripts %-->
```

vs

```html
<!--% scripts %-->
<script type="text/javascript" src="{!URLFOR($Resource.vendors_admin~main_react_dom, 'vendors_admin~main_react_dom.bundle.js')}" ></script>
<script type="text/javascript" src="{!URLFOR($Resource.main, 'main.bundle.js')}"></script>
<!--% scripts %-->
``` -->