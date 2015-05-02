'use strict';

var pathToRegExp = require('path-to-regexp'),
  readall = require('readall'),
  ssdb = require('ssdb');

module.exports = function(options) {
  options = options || {};
  var ssdbOptions = options.ssdb || {},
    prefix = options.prefix || 'koa-ssdb-cache:',
    expire = options.expire || 30 * 60, // 30 min
    routes = options.routes || ['(.*)'],
    exclude = options.exclude || [],
    passParam = options.passParam || '',
    maxLength = options.maxLength || Infinity,
    onerror = options.onerror || function() {};

  /**
   * ssdbClient
   */
  ssdbOptions.port = ssdbOptions.port || 8888;
  ssdbOptions.host = ssdbOptions.host || 'localhost';
  ssdbOptions.promisify = true;
  var pool = ssdb.createPool(ssdbOptions);
  var ssdbClient = pool.acquire();

  return function * cache(next) {
    var ctx = this,
      url = ctx.request.url,
      path = ctx.request.path,
      key = prefix + url,
      tkey = key + ':type',
      match = false,
      routeExpire = false;

    for (var i = 0; i < routes.length; i++) {
      var route = routes[i];

      if (typeof routes[i] === 'object') {
        route = routes[i].path;
        routeExpire = routes[i].expire;
      }

      if (paired(route, path)) {
        match = true;
        break;
      }
    }

    for (var j = 0; j < exclude.length; j++) {
      if (paired(exclude[j], path)) {
        match = false;
        break;
      }
    }
    
    console.log(ssdbClient.isAvailable());

    if (/*!ssdbClient.isAvailable() || */!match || (passParam && ctx.request.query[passParam])) {
      return yield * next;
    }

    var ok = false;
    try {
      ok = yield getCache(ctx, key, tkey);
    } catch (e) {
      ok = false;
    }
    if (ok) {
      return;
    }

    yield * next;

    try {
      var trueExpire = routeExpire || expire;
      yield setCache(ctx, key, tkey, trueExpire);
    } catch (e) {}
    routeExpire = false;
  };

  /**
   * getCache
   */
  function * getCache(ctx, key, tkey) {
    var value = yield ssdbClient.get(key),//.catch(console.log),
      type,
      ok = false;

    if (value) {
      ctx.response.status = 200;
      type = (yield ssdbClient.get(tkey)) || 'text/html';
      ctx.response.set('X-Koa-SSDB-Cache', 'true');
      ctx.response.type = type;
      ctx.response.body = value;
      ok = true;
    }

    return ok;
  }

  /**
   * setCache
   */
  function * setCache(ctx, key, tkey, expire) {
    var body = ctx.response.body;

    if ((ctx.request.method !== 'GET') || (ctx.response.status !== 200) || !body) {
      return;
    }

    if (typeof body === 'string') {
      // string
      if (Buffer.byteLength(body) > maxLength) return;
      yield ssdbClient.setx(key, body, expire);
    } else if (Buffer.isBuffer(body)) {
      console.log(ctx.response.type);
      // buffer
      if (body.length > maxLength) return;
      yield ssdbClient.setx(key, body, expire);
    } else if (typeof body === 'object' && ctx.response.type === 'application/json') {
      // json
      body = JSON.stringify(body);
      if (Buffer.byteLength(body) > maxLength) return;
      yield ssdbClient.setx(key, body, expire);
    } else if (typeof body.pipe === 'function') {
      // stream
      body = yield read(body);
      ctx.response.body = body;
      if (Buffer.byteLength(body) > maxLength) return;
      yield ssdbClient.setx(key, body, expire);
    } else {
      return;
    }

    yield * cacheType(ctx, tkey, expire);
  }

  /**
   * cacheType
   */
  function * cacheType(ctx, tkey, expire) {
    var type = ctx.response.type;
    if (type) {
      yield ssdbClient.setx(tkey, type, expire);
    }
  }
};

function paired(route, path) {
  var options = {
    sensitive: true,
    strict: true,
  };

  return pathToRegExp(route, [], options).exec(path);
}

function read(stream) {
  return function(done) {
    readall(stream, done);
  };
}
