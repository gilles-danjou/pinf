
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require('util');
var STREAM = require('term').stream;
var FILE = require("file");
var DATABASE = require("database", "common");
var PINF = require("pinf", "common");

var ARGS = require("args");
var parser = exports.parser = new ARGS.Parser();

parser.help('PINF - A Toolchain Automation Platform');
parser.option("--db").set().help("Path to PINF database");
parser.helpful();


var commandsDir = FILE.Path(module.path).dirname().join("commands");
commandsDir.listPaths().forEach(function(entry) {
    var id = "./" + commandsDir.relative(entry.valueOf());
    id = id.substring(0,id.length-3);
    
    UTIL.every(require(id), function(pair) {
        parser.command(pair[0], pair[1]);
    });
    
});


exports.getDatabase = function() {
    return PINF.getDatabase();
}

exports.locatorForDirectory = function(directory) {
    return PINF.locatorForDirectory(directory);
}


exports.main = function (args) {
    var options = parser.parse(args,{
        preActCallback: function(options) {
            var path;
            if(options.db && (path = FILE.Path(options.db)).exists() ) {
                PINF.setDatabase(DATABASE.Database(path));
            } else {
                PINF.setDatabase(PINF.getDefaultDatabase());
            }

            return true;
        }
    });
    if (!options.acted) {
        parser.printHelp(options);
    }
}
