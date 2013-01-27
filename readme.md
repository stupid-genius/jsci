JavaScript Compiler Interpreter
================
This is a very basic LL(1) grammar parser capable of working on any grammar it is given.  This is the first compiler I've written and it is extremely primative.  I am putting it in the public space so that others can use it, study it, and fix or improve it.  I have created no documentation for it, but others are more than welcome to.  As my purpose in writing this was to learn about compilers, I'd like for all code changes to be accompanied by thorough explanation so that I (and others) can learn.

TODO:
============
-epsilon rules just use last rule--can we match instead?
-add code to Array.prototype to avoid custom objects (map, stack, etc.)
-find better handling of overlapping token patterns
-add caching to first and follow

Demo:
============
http://stupid-genius.com/jsci/compiler.html