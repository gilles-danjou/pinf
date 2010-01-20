PINF Registry Server
====================

A server to track package releases.

About
=====

A pinf registry server tracks package releases for the purpose of organizing these for package installers.

A package may be tracked if it contains a `package.json` file as specified [here](http://wiki.commonjs.org/wiki/Packages/1.0).

You can host your own registry server or use [http://registry.pinf.org/](http://www.pinf.org/) which operates as
a free public infrastructure service.


Docs
====

  * [Lifecycle](http://github.com/cadorn/pinf/blob/master/docs/Lifecycle.md)

Dev Setup
=========

**NOTE:** *You must be using Christoph Dorn's **experimental** narwhal branch for extra tusk functionality.*

    tusk package install --alias gae-devtools http://github.com/cadorn/gae-runner/raw/master/catalog.json devtools

Dev Server:

    gae launch --package registry-server --build --dev

Deployment:

    tusk package --package registry-server build dist

Supported
=========

Commands via [cli](http://github.com/cadorn/pinf/tree/master/packages/cli/):

    pinf register-namespace http://registry.pinf.org/<owner>/<path>/
    pinf register-package <owner>/<path> <PackageDirectory>
    pinf register-package <owner>/<path> <PackageUID>
    pinf announce-release <PackageDirectory>

Public URLs:

    http://registry.pinf.org/<owner>/<path>/<PackageName>/
    http://registry.pinf.org/<owner>/<path>/catalog.json
    http://registry.pinf.org/@feeds/announcements.json
    http://registry.pinf.org/@webhooks/post-commit

TODO
====

  * Filter announcements feed based on various criteria
    * `http://registry.pinf.org/feeds/announcements.json?...`
  * @meta support for packages
    * `http://registry.pinf.org/<owner>/<path>/<PackageName>/@meta/<MetaPath>`
  * implements support
    * `http://registry.pinf.org/implements/<ImplementsID>`
  * Webhook for github post-commit
  * Etags for public package info and catalog requests
  * Remove old entries (5min +) from "Announcement" table (via cron)
  * Realtime (via XMPP) notifications of announcements
  * Validate package descriptors and return error info to client
  * Backup of datastore (if google does not beat us to it)


License
=======

[MIT License](http://www.opensource.org/licenses/mit-license.php)

Copyright (c) 2009-2010 Christoph Dorn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
