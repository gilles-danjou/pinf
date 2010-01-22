PINF Vendors
============

PINF provides an abstraction to work with vendors by encoding and decoding PINF-internal data to
formats and urls that vendors implement.

This functionality is currently encapsulated in `http://github.com/cadorn/pinf/blob/master/packages/common/lib/vendor.js`.

General
-------

###package.json

To declare that a package is hosted in a repository on a vendor's site the `repositories` property
in the `package.json` [package descriptor](http://wiki.commonjs.org/wiki/Packages/1.0) is used.

Only the first repository listed is considered at this time.

    "repositories": [
        {
            "type": "git", 
            "url": "git://github.com/cadorn/pinf.git"
        }
    ]    

PINF will take the repository info and `complete` it to look like the following:

    "repositories": [
        {
            "type": "git",
            "url": "git://github.com/cadorn/pinf.git",
            "raw": "http://github.com/cadorn/pinf/raw/{rev}/{path}",
            "download": {
                "type": "zip",
                "url": "http://github.com/cadorn/pinf/zipball/{rev}/"
            }
        }
    ]

###post-commit

To auto-announce package releases PINF supports a webhook that may be triggered on post-commit.

    http://registry.pinf.org/@webhooks/post-commit/<vendor>


github.com
----------

Github is fully supported and is the reference implementation for other vendors.

###package.json

    "repositories": [
        {
            "type": "git", 
            "url": "git://github.com/cadorn/pinf.git"
        }
    ]    

###post-commit

    http://registry.pinf.org/@webhooks/post-commit/github.com

