/***************************************
*	String Scanner
*	author: Allen Ng
***************************************/
function StringScanner(string){
	if(string===undefined || typeof string !== 'string'){
		throw 'Illegal argument';
	}

	var tokens = {};
	var iCurIndex = 0;
	var nextTokenKey;

	this.addToken = function(patternName, pattern){
		if(tokens[patternName]===undefined){
			tokens[patternName] = pattern;
		}
		else{
			throw 'Token already added.';
		}
	};

	this.hasNext = function(){
		nextTokenKey = null;
		var hasNext = false;
		var keys = Object.keys(tokens);
		// this search is done in two parts to allow ε rules to be found last
		for(var t in keys){
			if(/^&/.test(keys[t])){
				continue;
			}
			if(this.hasNextExp(tokens[keys[t]])){
				nextTokenKey = keys[t];
				hasNext = true;
				break;
			}
		}
		if(!hasNext){
			for(var t in keys){
				if(!/^&/.test(keys[t])){
					continue;
				}
				if(this.hasNextExp(tokens[keys[t]])){
					nextTokenKey = keys[t];
					hasNext = true;
					break;
				}
			}
		}
		return hasNext;
	};
	this.hasNextPat = function(patternName){
		return this.hasNextExp(tokens[patternName]);
	};
	this.hasNextExp = function(pattern){
		var bFound = false;
		var regexPattern = new RegExp('^'+pattern);
		if(iCurIndex < string.length){
			if(regexPattern.test(string.substring(iCurIndex))){
				bFound = true;
			}
		}
		return bFound;
	};

	/*
	 *	precondition: hasNext() returns true
	 *	postcondition: returns next token without advancing
	 */
	this.peek = function(){
		var regexPattern = new RegExp('^'+tokens[nextTokenKey]);
		return string.substring(iCurIndex).match(regexPattern)[0];
	};
	/*
	 *	precondition: hasNext() returns true
	 *	postcondition: next advances curToken and returns it
	 */
	this.next = function(){
		return this.nextExp(tokens[nextTokenKey]);
	};
	this.nextPat = function(patternName){
		return this.nextExp(tokens[patternName]);
	};
	this.nextExp = function(pattern){
		var sMatch = this.peek();
		iCurIndex += sMatch.length;
		if(/^\s+/.test(string.substring(iCurIndex))){
			iCurIndex += string.substring(iCurIndex).match(/^\s+/)[0].length;
		}
		return sMatch;
	};

	Object.defineProperties(this, {
		curToken: {
			get: this.peek
		}
	});

	this.toJSON = function(){
		return tokens;
	};
};
