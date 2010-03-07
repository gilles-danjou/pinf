

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
var SEMVER = require("semver", "util");
var OS = require("os");


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

PackageStore.prototype.getSources = function() {
    return this.sources;
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
                throw new PackageStoreError("No package found at: " + path);
            }
            DESCRIPTOR.PackageDescriptor(path.join("package.json")).validate();
            var packagePath = this.getPackagesPath().join(path);
            if(packagePath.exists()) {
                if(!packagePath.isLink()) {
                    throw new PackageStoreError("Found hard directory instead of link at: " + packagePath);
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
            if(vendor) {
                downloadInfo = vendor.getDownloadInfoForUrl(uri.url);
            } else {
                // no specific vendor found - try and determine download info ourselves
                var ext = FILE.Path(uri.file).extension().substr(1);
                switch(ext) {
                    case "tgz":
                        downloadInfo = {
                            "type": ext,
                            "url": uri.url
                        };
                        break;
                    default:
                        throw new PackageStoreError("Direct download URL with extension '"+ext+"' not supported!");
                        break;
                }
            }
        } else {
            throw new PackageStoreError("Package locators for URL scheme '"+uri.scheme+"' are not supported yet!");
        }
    } else {
        throw new PackageStoreError("You should never reach this!");
    }
    var packagePath = this.getPackagesPath().join(locator.getTopLevelId());    
    if(packagePath.exists()) {
        if(packagePath.isLink()) {
            throw new PackageStoreError("Found link instead of hard directory at: " + packagePath);
        }
        return PACKAGE.Package(packagePath, locator);
    }
    var url = downloadInfo.url;
    if(!this.downloads.has(url)) {
        url = download(url);
    }
    var file = this.downloads.get(url);
    if(!file.exists()) {
        throw new PackageStoreError("Error downloading archive from: " + url);
    }
    if(file.size()==0) {
        file.remove();
        throw new PackageStoreError("Downloaded archive is empty: " + url);
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
                throw new PackageStoreError("Error unzipping: " + e + " file: " + file + " from url: " + url);
            }
        } else
        if(downloadInfo.type=="tgz") {
            extractionPath.mkdirs();
            OS.command("tar -zxvf " + file + " -C " + extractionPath);
            if(!UTIL.len(extractionPath.listPaths())) {
                OS.command("rm -Rf " + extractionPath);
                file.remove();
                throw new PackageStoreError("Error untargzipping: file: " + file + " from url: " + url);
            }
        } else {
            throw new PackageStoreError("Archive type not supported: " + downloadInfo.type);
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
            // convert revision into MAJOR version if applicable
            // this ensures 0.1.0alpha can be linked while actual versions (0.1.0alpha1) are hard directories
            var fsLocator = locator.clone();
            var major = SEMVER.getMajor(locator.getRevision(), true);
            if(major) {
                fsLocator.setRevision(major);
            }
            // link package
            var packagePath = self.getPackagesPath().join(fsLocator.getTopLevelId());
            if(packagePath.exists()) {
                if(!packagePath.isLink()) {
                    throw new PackageStoreError("Found hard directory instead of link at: " + packagePath);
                }
            } else {
                packagePath.dirname().mkdirs();
                descriptor.getPath().dirname().symlink(packagePath);
            }
            return PACKAGE.Package(packagePath, locator);
        }
        return false;
    }

    function download(url) {
        // PINF mirrors popular downloads. We check the mirror for some types of packages.
        // TODO: The types of packages to check for on the mirror should be configurable
        try {
            var uri = URI.parse(url);
            if(uri.domain=="github.com" && uri.directories[2]=="zipball" && uri.file!="master") {
                var mirrorUrl = "http://mirror.pinf.org/" + uri.domain + uri.path;
                if(self.downloads.has(mirrorUrl)) {
                    return url;
                }
                self.downloads.download(mirrorUrl);
                return mirrorUrl;
            }

        } catch(e) {
            // file is not in mirror
        }
        self.downloads.download(url);
        return url;
    }
}

PackageStore.prototype.deepMappingsForPackage = function(pkg, mappings) {
    if(!pkg || !pkg.exists()) {
        throw new PackageStoreError("No valid package object");
    }
    mappings = mappings || [];
    var self = this,
        descriptor,
        depPackage;

    [
        "Using",
        "Platform",
        "Dependency"
    ].forEach(function(type) {
        pkg.getDescriptor()["every"+type](function(name, locator) {
            if(!locator) return;
            depPackage = self.get(locator);
            if(self.sources && (descriptor = self.sources.getDescriptor(locator))) {
                mappings.push([locator.getSpec(), descriptor.getPath().dirname().valueOf(), type.toLowerCase()]);
            } else {
                mappings.push([locator.getSpec(), depPackage.getPath().valueOf(), type.toLowerCase()]);
            }
            self.deepMappingsForPackage(depPackage, mappings);
        });
    });

    return mappings;
}



var PackageStoreError = exports.PackageStoreError = function(message) {
    this.name = "PackageStoreError";
    this.message = message;

    // this lets us get a stack trace in Rhino
    if (typeof Packages !== "undefined")
        this.rhinoException = Packages.org.mozilla.javascript.JavaScriptException(this, null, 0);
}
PackageStoreError.prototype = new PackageStoreError();


