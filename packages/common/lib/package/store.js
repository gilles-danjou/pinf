

function dump(obj) { print(require('test/jsdump').jsDump.parse(obj)) };


var UTIL = require("util");
var FILE = require("file");
var JSON = require("json");
var FS_STORE = require("http/fs-store");
var CATALOGS = require("../catalogs");
var PACKAGE = require("../package");
var DESCRIPTOR = require("./descriptor");
var ZIP = require("zip");
var URI = require("uri");
var VENDOR = require("../vendor");


var PackageStore = exports.PackageStore = function(path) {
    if (!(this instanceof exports.PackageStore))
        return new exports.PackageStore(path);

    this.path = path;

    this.catalogs = CATALOGS.Catalogs(this.path.join("catalogs"));
    this.downloads = new FS_STORE.Store(this.path.join("downloads"));
}

PackageStore.prototype.exists = function() {
    return this.path.exists();
}

PackageStore.prototype.getPackagesPath = function() {
    return this.path.join("packages");
}

PackageStore.prototype.setSources = function(sources) {
    this.sources = sources;
}

PackageStore.prototype.get = function(locator) {
    var descriptor,
        downloadInfo,
        pkg,
        self = this;
    if(locator.isCatalog()) {
        if(pkg = checkSources(locator)) {
            return pkg;
        }
        descriptor = this.catalogs.get(locator.getUrl()).getDescriptor(locator);
        locator.pinAtVersion(descriptor.getVersion());
        downloadInfo = descriptor.getDownloadInfo();
    } else
    if(locator.isDirect()) {
        var uri = URI.parse(locator.getUrl());
        if(uri.scheme=="file") {
            if(pkg = checkSources(locator)) {
                return pkg;
            }
            var path = FILE.Path(uri.path);
            if(path.split().pop()=="") path = path.dirname();
            if(!path.exists()) {
                throw new Error("No package found at: " + path);
            }
            DESCRIPTOR.PackageDescriptor(path.join("package.json")).validate();
            var packagePath = this.getPackagesPath().join(path);
            if(packagePath.exists()) {
                if(!packagePath.isLink()) {
                    throw new Error("Found hard directory instead of link at: " + packagePath);
                }
            } else {
                packagePath.dirname().mkdirs();
                path.symlink(packagePath);
            }
            return PACKAGE.Package(packagePath, locator);
        } else
        if(uri.scheme=="http") {
            if(pkg = checkSources(locator)) {
                return pkg;
            }
            var vendor = VENDOR.getVendorForUrl(uri.url);
            if(!vendor) {
                throw new Error("External HTTP direct package locators are not supported for vendor: " + uri.domain);
            }
            downloadInfo = vendor.getDownloadInfoForUrl(uri.url);
        } else {
            throw new Error("Package locators for URL scheme '"+uri.scheme+"' are not supported yet!");
        }
    } else {
        throw new Error("You should never reach this!");
    }
    var packagePath = this.getPackagesPath().join(locator.getTopLevelId());    
    if(packagePath.exists()) {
        if(packagePath.isLink()) {
            throw new Error("Found link instead of hard directory at: " + packagePath);
        }
        return PACKAGE.Package(packagePath, locator);
    }
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
            try {
                new ZIP.Unzip(file).forEach(function (entry) {
                    if (entry.isDirectory())
                        return;
                    var parts = FILE.split(entry.getName());
                    parts.shift(); // name-project-comment ref dirname
                    var path = extractionPath.join(FILE.join.apply(null, parts));
                    path.dirname().mkdirs();
                    path.write(entry.read('b'), 'b');
                });
            } catch(e) {
                file.remove();
                throw new Error("Error unzipping: " + e + " file: " + file + " from url: " + downloadInfo.url);
            }
        } else {
            throw new Error("Archive type not supported: " + downloadInfo.type);
        }
    }
    packagePath.dirname().mkdirs();
    if(downloadInfo.path) {
        extractionPath.join(downloadInfo.path).move(packagePath);
        extractionPath.rmtree();
    } else {
        extractionPath.move(packagePath);
    }
    // now that the package is extracted we over-write the package.json file with the one from the catalog
    // but only if the catalog descriptor contains a version (this excludes the generic/arbitraty descriptor for a package)
    if(descriptor) {
        var spec = descriptor.getCompletedSpec();
        if(spec.version) {
            packagePath.join("package.json").write(JSON.encode(spec, null, "  "));
        }
    }
    return PACKAGE.Package(packagePath, locator);
    
    
    
    function checkSources(locator) {
        if(!locator.getForceRemote() && self.sources && (descriptor = self.sources.getDescriptor(locator))) {
            // link package
            var packagePath = self.getPackagesPath().join(locator.getTopLevelId());
            if(packagePath.exists()) {
                if(!packagePath.isLink()) {
                    throw new Error("Found hard directory instead of link at: " + packagePath);
                }
            } else {
                packagePath.dirname().mkdirs();
                descriptor.getPath().dirname().symlink(packagePath);
            }
            return PACKAGE.Package(packagePath, locator);
        }
        return false;
    }
}

PackageStore.prototype.deepMappingsForPackage = function(pkg, mappings) {
    if(!pkg || !pkg.exists()) {
        throw new Error("No valid package object");
    }
    mappings = mappings || [];
    var self = this,
        descriptor,
        usingPackage;
    pkg.getDescriptor().everyUsing(function(name, locator) {
        usingPackage = self.get(locator);
        if(self.sources && (descriptor = self.sources.getDescriptor(locator))) {
            mappings.push([locator.getSpec(), descriptor.getPath().dirname().valueOf()]);
        } else {
            mappings.push([locator.getSpec(), usingPackage.getPath().valueOf()]);
        }
        self.deepMappingsForPackage(usingPackage, mappings);
    });
    
    // TODO: Collect system package dependencies
    
    return mappings;
}
