/***************************************
*	JavaScript Scanner
*	author: Allen Ng
***************************************/
module.exports =
function jsScanner(string)
{
// private
	var sString = string;
	var tokens = new Array();
	var iCurIndex = 0;
// public
	this.curToken;
	this.curTokenType;

	this.addToken = function(patternName, pattern)
	{
		if(tokens.indexOf(patternName)===-1)
			tokens[patternName]= pattern;
		else
			throw "Token already added.";
	}

	this.hasNext = function()
	{
		var bFound = false;
		var keys = Object.keys(tokens);
		for(var t in keys)
		{
			if(keys[t].search(/^&/)!=-1)
			{
				continue;
			}
			if(this.hasNextExp(tokens[keys[t]]))
			{
				this.curTokenType = keys[t];
				bFound = true;
				break;
			}
		}
		if(!bFound)
		for(var t in keys)
		{
			if(keys[t].search(/^&/)==-1)
			{
				continue;
			}
			if(this.hasNextExp(tokens[keys[t]]))
			{
				this.curTokenType = keys[t];
				bFound = true;
				break;
			}
		}
		return bFound;
	}
	this.hasNextPat = function(patternName)
	{
		return this.hasNextExp(tokens[patternName]);
	}
	this.hasNextExp = function(pattern)
	{
		var bFound = false;
		var regexPattern = new RegExp('^'+pattern);
		if(iCurIndex < sString.length)
		{
			if(sString.substring(iCurIndex).search(regexPattern)!=-1)
			{
				this.curToken = sString.substring(iCurIndex).match(regexPattern)[0];
				bFound = true;
			}
		}
		return bFound;
	}
/*
*	precondition: hasNext() has been called
*	postcondition: next advances curToken and returns it
*/
	this.next = function()
	{
		return this.nextExp(tokens[this.curTokenType]);
	}
	this.nextPat = function(patternName)
	{
		return this.nextExp(tokens[patternName]);
	}
	this.nextExp = function(pattern)
	{
		var regexPattern = new RegExp('^'+pattern);
		var sMatch = sString.substring(iCurIndex).match(regexPattern)[0];
		iCurIndex += sMatch.length;
		if(sString.substring(iCurIndex).search(/^\s+/)!=-1)
			iCurIndex += sString.substring(iCurIndex).match(/^\s+/)[0].length;
		return sMatch;
	}
};
