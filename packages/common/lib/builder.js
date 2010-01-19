

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };

var UTIL = require("util");


var Builder = exports.Builder = function(pkg, options) {
    if (!(this instanceof exports.Builder))
        return new exports.Builder(pkg, options);
    
    if(this.construct===Builder.prototype.construct) {
        this.construct(pkg, options);
    }
}

Builder.prototype.construct = function(pkg, options) {
    this.pkg = pkg;
    this.options = options;
}

Builder.prototype.build = function(program) {

    var descriptor = this.pkg.getDescriptor(),
        spec = descriptor.getPinfSpec(),
        self = this;
    
    // build all dependencies first
    descriptor.everyUsing(function(name, locator) {
        var pkg = self.options.packageStore.get(locator);
        var builder = pkg.getBuilder(self.options);
        builder.build(program);        
    });

    print("build package: " + this.pkg.getPath());


dump(spec);            
    
    // link all declared commands
    if(spec.commands) {
        var sourcePath,
            targetPath;
        UTIL.every(spec.commands, function(command) {
            sourcePath = self.pkg.getPath().join("bin", command[1]);
            if(!sourcePath.exists()) {
                throw new Error("Command declared at 'pinf.commands['"+command[0]+"'] not found at: " + sourcePath);
            }
            targetPath = program.getPath().join(".build", "bin", command[0]);
            targetPath.dirname().mkdirs();
            sourcePath.symlink(targetPath);
        });
    }
    
    

}