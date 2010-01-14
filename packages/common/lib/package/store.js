

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var FILE = require("file");
var FS_STORE = require("http/fs-store");
var CATALOG = require("./catalog");
var ZIP = require("zip");


var PackageStore = exports.PackageStore = function(path) {
    if (!(this instanceof exports.PackageStore))
        return new exports.PackageStore(path);

    this.path = path;

    this.catalogs = new FS_STORE.Store(this.path.join("catalogs"));
    this.downloads = new FS_STORE.Store(this.path.join("downloads"));
}

PackageStore.prototype.exists = function() {
    return this.path.exists();
}

PackageStore.prototype.get = function(locator) {
    var descriptor,
        downloadInfo;
    if(locator.isCatalog()) {
        var url = url = locator.getUrl();
        if(!this.catalogs.has(url)) {
            this.catalogs.download(url);
        }
        descriptor = CATALOG.PackageCatalog(this.catalogs.get(url)).
            getDescriptor(locator);
        downloadInfo = descriptor.getDownloadInfo();
    } else
    if(locator.isDirect()) {
        throw new Error("Direct package locators are not supported!");
    }
    var packagePath = this.path.join("packages").join(locator.getFsPath(), descriptor.getVersion());    
    if(packagePath.exists())
        return packagePath;
    if(!this.downloads.has(downloadInfo.url)) {
        this.downloads.download(downloadInfo.url);
    }
    var file = this.downloads.get(downloadInfo.url);
    if(!file.exists()) {
        throw new Error("Error downloading archive from: " + downloadInfo.url);
    }
    if(file.size()==0) {
        file.remove();
        throw new Error("Downloaded archive is empty: " + downloadInfo.url);
    }
    var extractionPath = file.dirname().join(file.basename() + "~extracted");
    if(!extractionPath.exists()) {
        if(downloadInfo.type=="zip") {
            new ZIP.Unzip(file).forEach(function (entry) {
                if (entry.isDirectory())
                    return;
                var parts = FILE.split(entry.getName());
                parts.shift(); // name-project-comment ref dirname
                var path = extractionPath.join(FILE.join.apply(null, parts));
                path.dirname().mkdirs();
                path.write(entry.read('b'), 'b');
            });
        } else {
            throw new Error("Archive type not supported: " + downloadInfo.type);
        }
    }
    packagePath.dirname().mkdirs();
    extractionPath.move(packagePath);
    return packagePath;
}
