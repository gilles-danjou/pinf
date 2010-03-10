*Is this document missing information? [Tell us](http://groups.google.com/group/pinf-dev) what you want to know and we will do our best in writing additional content!*

About PINF
==========

PINF is a toolchain automation platform designed to manipulate your project artifacts via defined, predictable and repeatable processes in a globally unique [namespace](http://github.com/cadorn/pinf/blob/master/docs/Namespaces.md).

PINF organizes everything into [packages](http://github.com/cadorn/pinf/blob/master/docs/Packages.md) with associated meta data and transforms these into new packages via [builders](http://github.com/cadorn/pinf/blob/master/docs/Builders.md).

PINF is implemented in JavaScript on top of [Narwhal](http://narwhaljs.org/), primarily targets UNIX and adheres to standards set by [CommonJS](http://commonjs.org/) where possible.

PINF is language agnostic and [initial efforts](http://github.com/cadorn/pinf/blob/master/docs/Roadmap.md) are primarily concerned with JavaScript and PHP toolchains.


Tenets
------

 * **Open Standards** - If there is a standard, PINF leverages it.
 * **Open Data Platform** - All project data and meta data is fully accessible at all times.
 * **Layered Abstraction** - Dig deep into the stack and optimize anything.
 * **Incremental Engagement** - Migration through gradual integration.
 * **Atomicity** - Pervasive snapshot versioning from development to production.
 * **Idempotent Operations** - Reliability and predictability through design.


Project Links
-------------

 * Github: [http://github.com/cadorn/pinf](http://github.com/cadorn/pinf)
 * Twitter: [http://twitter.com/pinf](http://twitter.com/pinf)
 * Mailing list: [http://groups.google.com/group/pinf-dev](http://groups.google.com/group/pinf-dev)


Sponsorship & Open Source
-------------------------

The PINF project is licensed under [MIT](http://www.opensource.org/licenses/mit-license.php) and currently exclusively sponsored by [Christoph Dorn](http://www.christophdorn.com/). To ease PINF-based development, Christoph is working on a bunch of free and for-fee tools. These tools are optional and interact with PINF via published APIs open to any tool vendor. Christoph also offers commercial support and consulting services concerning anything related to PINF.

PINF strives to be a [first class Open Source project](http://almaer.com/blog/being-open-is-hard-as-we-have-seen-this-week):

 *  0 points: Say you are open (**Check**)
 * 10 points: Choose an OSI license (**Check**)
 * 20 points: Define the governance of the code (**Check**)
   * Does one company hold all of the cards? (*Yes, but that will change in time.*)
   * Can others participate? (**Yes**)
   * For code, who participates? (**Committers and contributors** - *Get Involved!*)
   * Can anyone patch? (**Yes - via github pull-requests for MIT licensed code**)
   * Can you, and if so how do you become a committer? (**Yes - prove your worth by getting involved**)
   * At the core: How are decisions made (**Democratic Dictatorship until we have a steering committee**)
 * 30 points: A reference implementation under an open source license (**Check**)
 * 40 points: Where does the IP stand? (**Clean & open**). Did you donate it to a foundation? (*No*)

There is always the question of whether Contributor Licensing Agreements are necessary to ensure clean IP. We believe intellectual property is sufficiently protected by requiring each contributor to license code under MIT prior to merging. This is accomplished by placing the following line at the top of a new or modified file prior to requesting a merge:

    // -- github First Last Copyright YYYY MIT License


History
-------

[Christoph Dorn](http://www.christophdorn.com/) has been tinkering with the concept of a complete toolchain platform for a long time. While the ideas behind PINF are quite simple, translating them into a workable reality has been anything but simple. In the past Christoph has made dozens of attempts implementing such a system with varying degrees of success. His latest effort on top of CommonJS and influenced by current trends of
collaborative open source development promises to be of great potential.


License
-------

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
