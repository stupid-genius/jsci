/***************************************
*	JavaScript Stack
*	written by: Allen Ng
***************************************/
function jsStack()
{
	var data = new Array();
	var manyItems = 0;
	this.peek = function()
	{
		if(manyItems==0)
			throw "EmptyStack";
		return data[manyItems-1];
	}
	this.pop = function()
	{
		if(manyItems==0)
			throw "EmptyStack";
		return data[--manyItems];
	}
	this.push = function(item)
	{
		data[manyItems++] = item;
	}
	this.isEmpty = function()
	{
		return manyItems==0;
	}
	this.size = function()
	{
		return manyItems;
	}
	this.getCapacity = function()
	{
		return data.length;
	}
}