[![NPM version][npm-img]][npm-url]
[![Build status][travis-img]][travis-url]
[![Test coverage][coveralls-img]][coveralls-url]
[![License][license-img]][license-url]
[![Dependency status][david-img]][david-url]

### koa-ssdb-cache

how to use
```js
var koa = require('koa'),
  app = koa(),
  cache = require('koa-ssdb-cache');

var options = {
  expire: 60,
  routes: ['/index']
};
app.use(cache(options));
```

### options
* prefix
  - type: `String`
  - ssdb key prefix, default is `koa-ssdb-cache:`
* expire
  - type: `Number`
  - ssdb expire time (second), default is `30 * 60` (30 min)
* passParam
  - type: `String`
  - if the passParam is existed in query string, not get from cache
* maxLength
  - type: `Number`
  - max length of the body to cache
* routes
  - type: `Array`
  - the routes to cache, default is `['(.*)']`
  - It could be `['/api/(.*)', '/view/:id']`, see [path-to-regexp](https://github.com/pillarjs/path-to-regexp)
* exclude
  - type: `Array`
  - the routes to exclude, default is `[]`
  - It could be `['/api/(.*)', '/view/:id']`, see [path-to-regexp](https://github.com/pillarjs/path-to-regexp)
* onerror
  - type: `Function`
  - callback function for error, default is `function() {}`
* ssdb
  - type: `Object`
  - ssdb options
* ssdb.port
  - type: `Number`
* ssdb.host
  - type: `String`
* ssdb.options
  - type: `Object`
  - see [node_ssdb](https://github.com/eleme/node-ssdb)

### set different expire for each route
```js
var koa = require('koa'),
  app = koa(),
  cache = require('koa-ssdb-cache');

var options = {
  routes: [{
    path: '/index',
    expire: 60
  }, {
    path: '/user',
    expire: 5
  }]
};
app.use(cache(options));
```

### notes
* `koa-ssdb-cache` will set a custom http header `X-Koa-SSDB-Cache: true` when the response is from cache

### License
MIT

[npm-img]: https://img.shields.io/npm/v/koa-ssdb-cache.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-ssdb-cache
[travis-img]: https://img.shields.io/travis/iwater/koa-ssdb-cache.svg?style=flat-square
[travis-url]: https://travis-ci.org/iwater/koa-ssdb-cache
[coveralls-img]: https://img.shields.io/coveralls/iwater/koa-ssdb-cache.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/iwater/koa-ssdb-cache?branch=master
[license-img]: http://img.shields.io/badge/license-MIT-green.svg?style=flat-square
[license-url]: http://opensource.org/licenses/MIT
[david-img]: https://img.shields.io/david/iwater/koa-ssdb-cache.svg?style=flat-square
[david-url]: https://david-dm.org/iwater/koa-ssdb-cache
