*Is this document missing information? [Tell us](http://groups.google.com/group/pinf-dev) what you want to know and we will do our best in writing additional content!*

PINF Roadmap
============

The PINF project encompasses several sub-projects with a phased roll-out plan.


Sub-Projects
------------

 * **PINF CLI** - The PINF command-line tool (see [CLI](http://github.com/cadorn/pinf/blob/master/docs/CLI.md)).
 * **PINF Registry Server** - The PINF registry server (see [Registry](http://github.com/cadorn/pinf/blob/master/docs/Registry.md)).
 * **PINF Platforms** - A collection of foundation platforms for PINF-based programs (see [http://github.com/cadorn/pinf/blob/master/docs/Platforms.md])
 * **PINF Build Server** - A PINF-based continuous integration server (see [http://github.com/cadorn/pinf/blob/master/docs/BuildServer.md])


Phase 1 - 2010
--------------

PINF is built around a platform approach where a *program package* declares a dependency on a *[platform package](http://github.com/cadorn/pinf/blob/master/docs/Platforms.md)* and PINF will do the rest to get your program compiled, launched and monitored no matter what the underlying hard and soft infrastructure looks like.

To get this working out of the box and completely automatic on all possible infrastructure and with all possible workflows and application architectures is a tall order. It will require a lot of learning and thousands of hours of time from contributors. We fully realize this is a large-scale and long-term effort that must be well managed.

It is absolutely critical to get the foundation right as everything built on top will accentuate every decision made underneath. Accordingly the mission of phase 1 is to:

**Mission: To provide a minimal standards-based and fully tested foundation upon which further exploration can take place.**

To accomplish this the following areas are being addressed:

 * **Meta Data Standards** - PINF makes heavy use of the [CommonJS packaging standard](http://wiki.commonjs.org/wiki/Packages/1.0) and proposes several amendments and new proposals for expanding the standards in this area. Concrete proposals will appear in the [CommonJS Wiki](http://wiki.commonjs.org/) soon.
 * **Coding & Documentation Standards** - JavaScript coding and documentation standards are pretty much non-existent. We have yet to choose a coding and documentation standard.
 * **Modular Design Standards** - PINF eats what it serves by being itself built in a PINF environment. This means we have great flexibility in what we can do and ensures PINF can evolve as fast as applications built with it. The chosen design of dynamically pulling in functionality packages via meta data declarations must be proven to support all kinds of workflows and application architectures.

Using PINF to build programs based on a few specialized *platform packages* is easy to do and works today. The true challenge lies in how to compose the dependency tree to provide interoperable and layered platforms that can be manipulated to provide a common denominator across underlying infrastructure and system administration concerns. For example it should be sufficient for a program to declare it depends on the *LAMP* platform and PINF will automatically assemble everything needed to run that program on any given system or cluster while giving the administrator freedom to post-tweak the setup as needed.

PINF is implemented to a level where exploration of how meta-data should be used to define program and platform composition is possible. The current PINF API has evolved from such explorations and represents a minimal set of features that are deemed to be essential as a foundation. The following list points to projects conducting these kinds of explorations.

 * [http://github.com/cadorn/platforms](http://github.com/cadorn/platforms) - These actively maintained PINF platform packages were developed while building PINF and will continue to evolve. They are the primary source of insight influencing PINF development to date.


Phase 2 - 2010/2011/+
---------------------

The second phase of the PINF project will be concerned with assembling a large set of [platform packages](http://github.com/cadorn/pinf/blob/master/docs/Platforms.md) into a cohesive stack that organizes a substantial set of popular open source projects.

For this to happen we must have a clear idea of how platform packages need to be organized, linked, coupled and interfaced with to produce maintainable systems that don't explode with complexity.

