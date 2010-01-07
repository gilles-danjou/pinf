
var URI = require("uri");
var WILDFIRE = require("wildfire/binding/narwhal");

var ARGS = require("args");
var parser = exports["show"] = new ARGS.Parser();

parser.help('Show any file in a viewer');
parser.helpful();
parser.action(function (options) {
    

    print("do show");    
    
    
    WILDFIRE.target("http://pinf.org/cadorn.org/fireconsole").send(
        "Message Meta",
        "Message Data ["+options.args+"]"
    );
    
    
    WILDFIRE.flush();

    
});
