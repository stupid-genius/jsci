var fs = require('fs');
var tokens = fs.readFileSync('compiler/tokens', 'ascii').split(/\r?\n/);

var terms = new Array();
module.exports = terms;

for(var t in tokens)
{
	var token = tokens[t].split(/ :\= /);
	terms[token[0]] = token[1];
}

