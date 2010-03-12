*Is this document missing information? [Tell us](http://groups.google.com/group/pinf-dev) what you want to know and we will do our best in writing additional content!*

PINF Fundamental Design: Namespace and Dependency System
========================================================

**STATUS: DRAFT**

**Audience:** [CommonJS community](http://commonjs.org/) in general and [narwhal community](http://narwhaljs.org/) specifically as PINF is built on top of narwhal.

This high-level design document outlines how PINF builds a namespace and dependency system on top of CommonJS. It is intended to inform CommonJS proposals concerned with providing the building blocks for package management:

  * *Concern 1:* **require2 semantics for [Modules 1.0](http://wiki.commonjs.org/wiki/Modules/1.0) specification** - implementations would have the option of supporting an additional require form with semantics coupled to a packaging standard - i.e. require("module", "package")
  * *Concern 2:* **packaging standard** - a way to compose programs by means of packages and package dependencies
  * *Concern 3:* **package catalog specification** - a way to distribute packages
  * *Concern 4:* **amendments to [Packages 1.0](http://wiki.commonjs.org/wiki/Packages/1.0) specification** - to support a package catalog specification and source file referencing

CommonJS aims to standardize a common system API for JavaScript across various implementations that will provide the foundation for a vast ecosystem of libraries and applications. History has shown that languages and platforms with a good package management design have evolved with more success than those without. This speaks to the value of standardizing a minimal scaffold that affords package management ecosystems to evolve as well.

The design of PINF is concerned with addressing the package management problem space by standardizing a namespace and dependency system for packages. The convention is anchored on using HTTP URLs to disambiguate between packages in a unique global namespace. Following is an example of two dependent packages:

    http://domain.org/path/to/myPackage/1.3.2.zip ~ /package.json ~ {
        "dependencies": [
            "narwhal",
            "domain.net/another/path/to/yourPackage/1"    // put package's modules onto system namespace
        ],
        "packages": {
            "theirPackage": {    // a location based "package locator"
                "location": "http://domain.net/another/path/to/yourPackage/1.3.2.zip"
            }
        }
    }
    http://domain.org/path/to/myPackage/1.3.2.zip ~ /lib/myModule.js ~ {
        var THEIR_MODULE = require("myModule", "theirPackage");
        // or              require("myModule", "domain.net/another/path/to/yourPackage/1.3.2.zip");
        var HELPER = require("./alsoMyModule");
        var channel = THEIR_MODULE.NewChannel(module);
        channel.send(HELPER.getDependencies());
    }
    http://domain.org/path/to/myPackage/1.3.2.zip ~ /lib/alsoMyModule.js ~ {
        var FILE = require("file");
        exports.getDependencies = function() { return module.packages; }
        // module.packages == {"theirPackage": "domain.net/another/path/to/yourPackage/1.3.2.zip"}
    }

    http://domain.net/another/path/to/yourPackage/1.3.2.zip ~ /lib/myModule.js ~ {
        var TERM = require("term");
        var NewChannel = exports.NewChannel = function(callingModule) {
            if (!(this instanceof exports.NewChannel)) return new exports.NewChannel(callingModule);
            this.cm = callingModule;
        }
        NewChannel.prototype.send - function(message) {
            TERM.stream.print("Message from " + this.cm.id + " in package " + this.cm["package"] + " follows: \n" + message);
        }
        // this.cm["package"] == "domain.net/another/path/to/yourPackage/1.3.2.zip"
    }

The example above is the lowest level of abstraction and can be implemented with modules stored on the filesystem at:

    /using/domain.org/path/to/myPackage/1.3.2.zip/package.json
    /using/domain.net/another/path/to/yourPackage/1.3.2.zip/package.json

This convention copies the URL minus the protocol and uses it as a filesystem path taking advantage of URL encoding if necessary.

The second level of abstraction introduces catalogs to remove the dependence on direct URLs for packages and offers a way to collect packages into meaningful collections.

    http://domain.org/path/to/myPackage/1.3.2.zip ~ /package.json ~ {
        "dependencies": [
            "narwhal",
            "very.cool.tv/catalogPackageName/1"    // put package's modules onto system namespace
        ],
        "packages": {
            "theirPackage": {    // a package based "package locator"
                "catalog": "http://very.cool.tv/catalog.json",
                "name": "catalogPackageName",
                "revision": "1.2.6"    // -> /1/
            }
        }
    }
    // require("myModule", "theirPackage");
    // require("myModule", "very.cool.tv/catalogPackageName/1");
    // module.packages == {"theirPackage": "very.cool.tv/catalogPackageName/1"}

    http://very.cool.tv/catalog.json ~ {
        "uid": "http://very.cool.tv/catalog.json",
        "packages": {
            "catalogPackageName": {
                "1": {    // directory
                    "uid": "http://domain.net/another/path/to/yourPackage/",
                    "name": "yourPackage",
                    "version": "1.3.2",
                    "downloads": [
                        {
                            "type": "zip",
                            "url": "http://domain.net/another/path/to/yourPackage/1.3.2.zip"
                        }
                    ]
                }
            }
        }
    }
    // module["package"] == "very.cool.tv/catalogPackageName/1"

The example above can be implemented with modules stored on the filesystem at:

    /using/domain.org/path/to/myPackage/1.3.2.zip/package.json
    /using/very.cool.tv/catalogPackageName/1/package.json

This convention joins the *catalog* URL minus the protocol and extension with the *name* and condensed *revision* property. The *revision* property is a release selector that is based on the semver convention. The selector assumes that package releases are backwards compatible and uses only the major version to disambiguate between "revisions". The *revision* also provides the minimum compatible version.

The conventions described above form a foundation that can evolve in many directions as the package namespace is not restricted to one central authority. This is considered to be desirable in encouraging innovation in the areas of modular design and dependency management. It is believed the approach presented is sufficient to scaffold all dependency resolution requirements that package managers or programs may impose.

Finally it is argued that provisions must be made to support collaborative workflows by enabling developers to share pre-stable releases of their code. To accomplish this the revision selector follows additional conventions as illustrated below:

      version       directory    revision selectors
    t 0.1.0         0            0.1.0  or  0.1  or  0  or  0*
    i 0.1.1alpha    0alpha       0.1.1alpha  or  0.1alpha  or  0alpha  or  0*
    m 1.0.0         1            1.0.0  or  1.0  or  1  or  1*
    e 1.0.1alpha1   1alpha       1.0.1alpha1  or  1.0.1alpha  or  1.0alpha  or  1alpha
      1.0.1alpha2   1alpha       1.0.1alpha1  or  1.0.1alpha2  ...
    - 2.0.0rc1      2rc          2rc  or  2*  ...
    | 2.0.0         2            2rc  or  2*  ...
    | 3.0.0alpha1   3alpha       3.0alpha  or  3*  ...
    V 3.0.0beta15   3beta        3.0alpha  or  3*  ...
      3.0.0rc3      3rc          3.0alpha  or  3*  ...
      3.0.0         3            3.0alpha  or  3*  ...
      3.5.7         3            3.0alpha  or  3*  ...  
    --latest--
      0.1.0         0
      0.1.1alpha    0alpha
      1.0.0         1
      1.0.1alpha2   1alpha
      2.0.0rc1      2rc
      2.0.0         2
      3.0.0alpha1   3alpha
      3.0.0beta15   3beta
      3.0.0rc3      3rc
      3.5.7         3
    --development branches--
      0.0.0rev-<ref>   <name>    <name>


Archives containing multiple packages
-------------------------------------

    http://domain.org/path/to/myPackage/1.3.2.zip ~ /package.json ~ {
        "packages": {
            "theirPackage": {
                "location": "http://domain.net/another/path/to/yourBundle/1.3.2.zip",
                "path": "packages/yourPackage"
            }
        }
    }
    // require("myModule", "theirPackage");
    // require("myModule", "domain.net/another/path/to/yourPackage/1.3.2.zip/packages/yourPackage");
    // module.packages == {"theirPackage": "domain.net/another/path/to/yourPackage/1.3.2.zip/packages/yourPackage"}

    http://domain.net/another/path/to/yourBundle/1.3.2.zip ~ /packages/yourPackage/package.json

    /using/domain.net/another/path/to/yourBundle/1.3.2.zip/packages/yourPackage/package.json

or

    http://domain.org/path/to/myPackage/1.3.2.zip ~ /package.json ~ {
        "dependencies": [
            "narwhal",
            "very.cool.tv/catalogPackageName/1"
        ],
        "packages": {
            "theirPackage": {
                "catalog": "http://very.cool.tv/catalog.json",
                "name": "catalogPackageName",
                "revision": "1.2.6"
            }
        }
    }
    // require("myModule", "theirPackage");
    // require("myModule", "very.cool.tv/catalogPackageName/1");
    // module.packages == {"theirPackage": "very.cool.tv/catalogPackageName/1"}

    http://very.cool.tv/catalog.json ~ {
        "uid": "http://very.cool.tv/catalog.json",
        "packages": {
            "catalogPackageName": {
                "1": {    // directory
                    "uid": "http://domain.net/another/path/to/yourPackage/",
                    "name": "yourPackage",
                    "version": "1.3.2",
                    "downloads": [
                        {
                            "type": "zip",
                            "url": "http://domain.net/another/path/to/yourPackage/1.3.2.zip",
                            "path": "packages/yourPackage"
                        }
                    ]
                }
            }
        }
    }
    // module["package"] == "very.cool.tv/catalogPackageName/1"
    
    /using/very.cool.tv/catalogPackageName/1/package.json


Catch-all for catalog package revisions
---------------------------------------

To empower development lifecycle tools the following optional extension to the catalog specification provides everything needed to reference arbitrary revisions of a package and the files it contains.

    http://very.cool.tv/catalog.json ~ {
        "uid": "http://very.cool.tv/catalog.json",
        "packages": {
            "catalogPackageName": {
                "*": {    // catch-all
                    "uid": "http://domain.net/another/path/to/yourPackage/",
                    "name": "yourPackage",
                    "downloads": [
                        {
                            "type": "zip",
                            "url": "http://domain.net/another/path/to/yourPackage/{rev}.zip",
                            "path": "packages/yourPackage"
                        }
                    ],
                    "repositories": [
                        {
                            "type": "git",
                            "url": "git://github.com/cool-tv/very.git",
                            "path": "packages/yourPackage",
                            "raw": "http://github.com/cool-tv/very/raw/{rev}/packages/yourPackage/{path}",
                            "download": {
                                "type": "zip",
                                "url": "http://github.com/cool-tv/very/zipball/{rev}/"
                            }
                        }
                    ]
                }
            }
        }
    }

It is sufficient for a package to specify the following minimal repository information where the remainder of the repository properties may be systematically derived by catalog authors.

    package.json ~ {
        "repositories": [
            {
                "type": "git",
                "url": "git://github.com/cool-tv/very.git",
                "path": "packages/yourPackage"
            }
        ]
    }


Catalogs without revisions
--------------------------

For production release catalogs it may be desirable to support a catalog structure that follows a more traditional format. The following is proposed as an optional format that removes the revision map and is intended for use with stable production release versions of packages only.

    http://very.cool.tv/catalog.json ~ {
        "uid": "http://very.cool.tv/catalog.json",
        "packages": {
            "catalogPackageName": {
                "uid": "http://domain.net/another/path/to/yourPackage/",
                "name": "yourPackage",
                "version": "1.3.2",
                "downloads": [
                    {
                        "type": "zip",
                        "url": "http://domain.net/another/path/to/yourPackage/1.3.2.zip",
                        "path": "packages/yourPackage"
                    }
                ]
            }
        }
    }


Sanctioned namespaces
---------------------

The namespace scheme proposed lends itself well to operate with the use of catalog registry servers. CommonJS could gain control of the top-level namespace by hosting an official registry server:

    http://registry.commonjs.org/                     // CommonJS Registry Server
    http://registry.commonjs.org/domain.com/...       // User-controlled namespace (hostname based)
    http://registry.commonjs.org/name@email.com/...   // User-controlled namespace (email based)
    http://registry.commonjs.org/<name>/...           // CommonJS delegated namespaces

Users may host registry servers as well:

    http://registry.domian.com/                     // User Registry Server
    http://registry.domian.com/domain.com/...       // User-controlled namespace
    http://registry.domian.com/name@email.com/...   // User-controlled namespace
    // NOTE: User registry servers may only provide namespaces where the top level
    //       name is a globally unique identifier constant across all registry servers.

It may be agreed on to drop the registry hostname from the namespace path to provide a more condensed path:

    /using/domain.com/...
    /using/name@email.com/...
    /using/<name>/...

Globally unique/meaningful top level names may be provided by hostnames, email addresses, IP addresses, mac addresses, phone numbers, uuids, OpenIDs, Latitude + Longitude, ISBN numbers, etc...


Relevant Discussions
--------------------

*TODO*

