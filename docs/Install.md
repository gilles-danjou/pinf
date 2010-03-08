
Installing PINF
===============

The easy way
------------

Coming soon!


From source
-----------

Requirements:

  * UNIX (Only Mac OSX is tested)
  * git
  * java

Build the PINF command line tool:

    cd ~
    mkdir pinf
    cd pinf
    mkdir bootstraps
    cd bootstraps
    git clone git://github.com/280north/narwhal.git narwhal
    export PATH=~/pinf/bootstraps/narwhal/bin:$PATH
    git clone git@github.com:cadorn/pinf.git pinf
    export PATH=~/pinf/bootstraps/pinf/bin:$PATH
    pinf-local build-program ~/pinf/bootstraps/pinf/packages/cli

The built binary is available at:

    ~/pinf/programs/registry.pinf.org/cadorn.org/github/pinf/programs/cli/master/bin/pinf

To make this convenient to use it should be on your `PATH` at all times.

Now run the test suite:

    pinf test
