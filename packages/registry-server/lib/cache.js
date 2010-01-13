
var MEMCACHED = require("google/appengine/api/memcache");


var seed = "";

exports.setSeed = function(value) {
    seed = value;
}

exports.set = function(key, value, expiry) {
    return MEMCACHED.set(seed + key, value, expiry);
}

exports.get = function(key) {
    return MEMCACHED.get(seed + key);
}

exports.remove = function(key) {
    return MEMCACHED.remove(seed + key);
}
