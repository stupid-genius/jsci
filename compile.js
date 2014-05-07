var fs = require('fs');
var tokens = require('./compiler/tokenLoader');
var grammar = require('./compiler/grammar');
var jsci = require('./compiler/jsCI.js');
var tiny = new jsci(tokens, 'program', grammar);
var linker;

var extension = '.tiny';
var inputFilename;
var outputFilename;

switch(process.argv.length)
{
case 4:
	outputFilename = process.argv[3];
case 3:
	inputFilename = process.argv[2];
	if(outputFilename === undefined)
		outputFilename = inputFilename+'.out';
	break;
default:
  console.log('usage: node compile.js <program> [outputFile]');
  return;
}

var source = fs.readFileSync(inputFilename, 'ascii');
var output = tiny.compile(source);
var modify = 'module.exports = '+output;
fs.writeFileSync(outputFilename, modify, 'ascii');
