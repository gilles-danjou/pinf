

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

Publisher.prototype.triggerPublish = function(program, options) {

    this.publish(program, options);

}


Publisher.prototype.publish = function(program, options) {
    // to be overwritten
}
