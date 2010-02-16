

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var FS_STORE = require("http/fs-store");
var CATALOG = require("./package/catalog");


var Catalogs = exports.Catalogs = function(path) {
    if (!(this instanceof exports.Catalogs))
        return new exports.Catalogs(path);

    this.path = path;

    this.store = new FS_STORE.Store(this.path);
}

Catalogs.prototype.has = function(url) {
    return this.store.has(url);
}

Catalogs.prototype.get = function(url) {
    if(!this.has(url)) {
        this.store.download(url);
    }
    var catalog = CATALOG.PackageCatalog(this.store.get(url));
    // download catalog if dirty
    if(catalog.getDirtyPath().exists()) {
        // TODO: Check eTags and only update if changed            
        this.store.download(url);
        catalog.getDirtyPath().remove();
        return this.get(url);
    }
    return catalog;
}

Catalogs.prototype.update = function(url, subPath) {
    var path = this.path,
        self = this;
    if(url) {
        update(url);
    } else {
        if(subPath) {
            path = path.join(subPath);
        }
        path.listPaths().forEach(function(item) {
            if(item.isDirectory()) {
                self.update(url, (subPath)?subPath.join(item.basename()):item.basename());
            } else
            if(item.basename().valueOf()=="catalog.json") {
                update("http://" + subPath.join(item.basename()).valueOf());
            }
        });
    }

    function update(url) {
        // TODO: Check eTags and only update if changed            
        self.store.download(url);
    }
}
