
function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require('util');
var STREAM = require('term').stream;
var FILE = require("file");
var SYSTEM = require("system");
var DATABASE = require("./database");

var ARGS = require("args");
var parser = exports.parser = new ARGS.Parser();

parser.help('PINF - A Toolchain Automation Platform');
parser.option("--db").set().help("Path to PINF database");
parser.helpful();


var database;

var commandsDir = FILE.Path(module.path).dirname().join("commands");
commandsDir.listPaths().forEach(function(entry) {
    var id = "./" + commandsDir.relative(entry.valueOf());
    id = id.substring(0,id.length-3);
    
    UTIL.every(require(id), function(pair) {
        parser.command(pair[0], pair[1]);
    });
    
});


exports.getDatabase = function() {
    return database;
}


exports.main = function (args) {
    var options = parser.parse(args,{
        preActCallback: function(options, context) {
            
            var dbPath;
            if(options.db) {
                dbPath = FILE.Path(options.db);
            }
            if(!dbPath || !dbPath.exists()) {
                dbPath = FILE.Path(SYSTEM.env["HOME"]).join(".pinf");
            }
            database = DATABASE.Database(dbPath);

            return true;
        }
    });
    if (!options.acted) {
        parser.printHelp(options);
    }
}
