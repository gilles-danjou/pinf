
var JSON = require("json");
var FILE = require("file");
var UTIL = require("util");
var LOCAL_MODULE = require("./module");
var EXTERNAL_MODULE = require("module", "test-package");

exports.main = function() {
    
    var memoPath = FILE.Path(system.sea).join("memo.txt");
    
    var info = {
        "local": LOCAL_MODULE.getInfo(),
        "external": EXTERNAL_MODULE.getInfo(),
        "memo": (memoPath.exists())?UTIL.trim(memoPath.read()):""
    }
    
    print(JSON.encode(info, null, "  "));
    
}
