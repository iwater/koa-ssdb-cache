'use strict';

var ssdb = require('ssdb'),
    pool = ssdb.createPool({promisify: true}),
    client = pool.acquire(),
  should = require('should'),
    co = require('co');

after(function(done) {
  co(function*(){
    var keys = yield client.keys("koa-", "p", -1);
    console.log('## flush db');
    yield keys.map(function(key){
      return client.del(key);
    });
    done();
  });
});
