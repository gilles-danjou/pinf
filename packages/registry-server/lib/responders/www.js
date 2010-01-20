
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var FILE = require("file");

exports.service = function(env) {
    
    return FILE.Path(module.path).dirname().join("../../www/index.htm").read();

}