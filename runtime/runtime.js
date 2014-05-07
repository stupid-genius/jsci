var fs = require('fs');
var execSync = require('execSync');

module.exports = {
	jsOut: function(string)
	{
		console.log(string);
	},
	jsIn: function()
	{
		var buffin = execSync.exec('read buffin;echo $buffin');
		return buffin.stdout.substring(0,buffin.stdout.length-1);
	}
}
