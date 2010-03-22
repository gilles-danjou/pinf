*Is this document missing information? [Tell us](http://groups.google.com/group/pinf-dev) what you want to know and we will do our best in writing additional content!*

PINF Notes
==========


TODO: Implements modules with versioned APIs
--------------------------------------------

You can declare that a package implements something by referencing a contract:

    "implements": {
        "http://registry.pinf.org/cadorn.org/github/pinf/@meta/platform/package/0.1.0": {
            ...
        }
    }

Which can be accessed in modules:

    <package>.getDescriptor().getImplementsForUri("<uri>")

At this time the URI must match exactly, the versionin string is arbitrary and the method returns the
JSON of the implements declaration. The URL:

   http://registry.pinf.org/cadorn.org/github/pinf/@meta/platform/package/0.1.0
   
is mapped to:

  <pinf>/meta/platform/package/0.1.0

by the PINF registry and the directory contains an informal markdown file describing the contract:

  <pinf>/meta/platform/package/0.1.0.md

Multiple contract versions must continue to exist with new package versions as existing packages
may be referencing old contracts and be expecting the API the old contract describes. This means
new package versions must continue to support the APIs old contracts describe.

**To formalize these conventions the following is proposed.**

Contract versions follow semantic versioning just like packages do.

  <pinf>/meta/platform/package/0.1.0.md
  <pinf>/meta/platform/package/0.1.1.md
  <pinf>/meta/platform/package/1.0.0.md
  <pinf>/meta/platform/package/1.1.0.md
  <pinf>/meta/platform/package/2.0.0.md

To abstract API versioning for contracts each contract version contains a module:

  <pinf>/meta/platform/package/X.X.X.js

These `contract modules` are callable *out of band* with no external dependencies. They formally document and enforce the API
of the contract to ease coding for the calling module:

  var api = <package>.getDescriptor().getImplements("<uri>")

The package implementing the contract module can map contract methods to internal code as needed and version the
contract modules accordingly. This means incrementing minor and patch versions for backwards compatible changes
and incrementing the major version for backwards incompatible changes to the contract.

To automatically obtain a reference to the most recent compatible contract module the semver is used just like it
is for package revision selection in a catalog-based package locator. The implements URL is parsed to obtain the
minimum version desired and the most recent module for the same major version is referenced.

The various use-cases for implements declarations and contract modules are being explored and an implementation
will be forthcoming.



Links
-----

**Libraries**

  * http://github.com/DmitryBaranovskiy/githubjs
  * http://github.com/Gozala/github


