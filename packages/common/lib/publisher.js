

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var Publisher = exports.Publisher = function(pkg, options) {
    if (!(this instanceof exports.Publisher))
        return new exports.Publisher(pkg, options);
    
    if(this.construct===Publisher.prototype.construct) {
        this.construct(pkg, options);
    }
}

Publisher.prototype.construct = function(pkg, options) {
    this.pkg = pkg;
    this.options = options;
}

Publisher.prototype.publish = function() {
    
    // publish all dependencies first
    var descriptor = this.pkg.getDescriptor(),
        self = this;
    descriptor.everyUsing(function(name, locator) {
        var pkg = self.options.packageStore.get(locator);
        var publisher = pkg.getPublisher(self.options);
        publisher.publish();        
    });



    print("publish package: " + this.pkg.getPath());


}