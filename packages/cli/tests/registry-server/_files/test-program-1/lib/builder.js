

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var BUILDER = require("builder", "http://registry.pinf.org/cadorn.org/github/pinf/packages/common/");

var Builder = exports.Builder = function(pkg) {
    if (!(this instanceof exports.Builder))
        return new exports.Builder(pkg);
    this.construct(pkg);
}

Builder.prototype = BUILDER.Builder();
