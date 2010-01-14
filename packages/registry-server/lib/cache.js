
var MEMCACHED = require("google/appengine/api/memcache");


var seed = "";
var enabled = true;

exports.setSeed = function(value) {
    seed = value;
}

exports.setEnabled = function(oo) {
    enabled = oo;
}

exports.set = function(key, value, expiry) {
    return MEMCACHED.set(seed + key, value, expiry);
}

exports.get = function(key) {
    if(!enabled) return false;
    return MEMCACHED.get(seed + key);
}

exports.remove = function(key) {
    return MEMCACHED.remove(seed + key);
}
