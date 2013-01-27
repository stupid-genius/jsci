/***************************************
*	JavaScript Map
*	written by: Allen Ng
***************************************/
function jsMap()
{
// private
	var values = new Array();

	this.add = function(sOfferedKey, offeredValue)
	{
		values[sOfferedKey] = offeredValue;
	}
	this.set = function(sKey, newValue)
	{
		values[sKey] = newValue;
	}
	this.contains = function(sKey)
	{
		var bFound = false;
		for(var i in values)
		{
			if(i == sKey)
			{
				bFound = true;
				break;
			}
		}
		return bFound;
	}
	this.keys = function()
	{
		var curKeys = new Array();
		for(var k in values)
			curKeys.push(k);
		return curKeys;
	}
	this.item = function(sKey)
	{
		return values[sKey];
	}
	this.remove = function(sKey)
	{
		values[sKey] = null;
	}
}