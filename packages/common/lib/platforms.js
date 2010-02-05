

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var URI = require("uri");
var FILE = require("file");
var PLATFORM = require("./platform");



var Platforms = exports.Platforms = function(path) {
    if (!(this instanceof exports.Platforms))
        return new exports.Platforms(path);

    this.path = path;
}

Platforms.prototype.getPath = function() {
    return this.path;
}

Platforms.prototype.forEach = function(callback, subPath) {
    var path = this.path,
        self = this;
    if(subPath) {
        path = path.join(subPath);
    }
    var found = false,
        dirs = [];
    path.listPaths().forEach(function(item) {
        if(found) return;
        if(item.basename()=="package.json") {
            found = true;
            callback(PLATFORM.Platform(item.dirname()));
        } else
        if(item.isDirectory()) {
            dirs.push(item.basename());
        }
    });
    if(!found) {
        dirs.forEach(function(dir) {
            self.forEach(callback, (subPath)?subPath.join(dir):dir);
        });
    }
}
