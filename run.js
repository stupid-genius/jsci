var SandboxedModule = require('sandboxed-module');
var rt = require('./runtime/runtime.js');
var jsOut = rt.jsOut;
var jsIn = rt.jsIn;

if(process.argv.length !== 3)
{
  console.log('usage: node run.js <program>');
  return;
}

SandboxedModule.require('./'+process.argv[2],
{
	globals: {jsOut: jsOut, jsIn: jsIn}
});
