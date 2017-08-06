/*****************************************************
*  JavaScript Compiler Interpreter
*
*	A programmable compiler; think "YACC Interpreter".
*
*	Author: Allen Ng
******************************************************
*	tokens	- array of tokens
*	start	- start symbol of grammar
*	grammar	- grammar object in JSON format
*****************************************************/
/*
This file is part of JavaScript Compiler Interpreter.

JavaScript Compiler Interpreter is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

JavaScript Compiler Interpreter is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with JavaScript Compiler Interpreter.  If not, see <http://www.gnu.org/licenses/>.
*/
/*
*	TO DO:
*	epsilon rules just use last rule--can we match instead?
*	find better handling of overlapping token patterns
*	add caching to first and follow
*/
function JSCI(tokens, start, grammar){
	var variables = [];
	var terminals = [];
	var reserved = [];
	var endofinput = "$";

	for(var t in tokens){
		terminals[t] = tokens[t];
		if(t.charAt(0)!=="$")
			reserved.push(tokens[t]);
	}
	for(var v in grammar){
		variables.push(v);
	}

	function match(a, t){
		var result = false;
		if(a.match(new RegExp(terminals[t]))){
			result = true;
			if(t.charAt(0)==="$"){
				for(var w in reserved){
					if(a.match(new RegExp("^"+reserved[w]+"$"))){
						result = false;
					}
				}
			}
		}
		return result;
	}
	function isNonTerminal(A){
		var result = false;
		for(var v in variables){
			if(variables[v]===A){
				result = true;
				break;
			}
		}
		return result;
	}
	function isTerminal(a){
		var result = false;
		var terms = Object.keys(terminals);
		for(var t in terms){
			if(a.match(new RegExp(terminals[terms[t]]))!==null){
				result = true;
				break;
			}
		}
		return result;
	}

	function production(A, a){
		var indicatedRule;
		var epsilonRule;

		var choices = grammar[A];
		for(var r in choices){
			try{
				var firstTokens = first(choices[r].rule);	//rhs
				for(var t in firstTokens){
					if(firstTokens[t]==="&")
						epsilonRule = choices[r];
					if(match(a, firstTokens[t])){
						indicatedRule = choices[r];
						break;
					}
				}
			}
			catch(e){
				console.error(e);
			}

			if(indicatedRule){
				break;
			}

			var followTokens = follow(A);	// can be end of input symbol
			for(var t in followTokens){
				if(followTokens[t]==="&")		// may be wrong
					epsilonRule = choices[r];
				if(match(a, followTokens[t])){
					indicatedRule = choices[r];
					break;
				}
			}
		}
		if(!indicatedRule){
			indicatedRule = epsilonRule;
		}

		return indicatedRule;	// there can be only one
	}
	/*
	*	computes the first tokens of all
	*	production choices for A
	*	A - consequent of a grammar rule
	*	return - an array
	*/
	function first(A){
		var elements = [];
		var a = A[0];

		if(isNonTerminal(a)){
			var firstRules = grammar[a];
			for(var r in firstRules){
				var a2;
				for(var i=0; i<firstRules[r].rule.length; ++i){
					a2 = first(firstRules[r].rule.slice(i));
					if(a2[0] !== "&")
						break;
				}
				for(var i in a2){
					elements.push(a2[i]);
				}
			}
		}
		else if(isTerminal(a)){
			elements.push(a);
		}
		else
			throw "First("+A+") contains an unknown symbol.";

		return elements;
	}
	/*
	*	computes the following tokens of
	*	all non-terminals A
	*	A - a non-terminal
	*	return - an array
	*/
	function follow(A){
		var elements = [];

		if(A === start)
			elements.push(endofinput);
		else{
			for(var v in variables){
				var choices = grammar[variables[v]];
				for(var r in choices)
				for(var i=0; i<choices[r].rule.length-1; ++i){
					if(choices[r].rule[i] !== A)
						continue;
					var followTokens = first(choices[r].rule.slice(i+1));
					if(followTokens.length === 0)
						followTokens = follow(variables[v]);
					for(var f in followTokens){
						elements.push(followTokens[f]);
					}
					break;
				}
			}
		}

		return elements;
	}

	this.compile = function(sSource){
		var output;
		var scanner = new jsScanner(sSource);
		var parseStack = [];
		var semanticStack = [];

		var keys = Object.keys(terminals);
		for(var t in keys)
			scanner.addToken(keys[t], terminals[keys[t]]);
		parseStack.push(start);

		while(scanner.hasNext()){
			var A = parseStack.pop();
			if(A==="&")
				continue;
			if(isNonTerminal(A)){
				var move = production(A, scanner.curToken);
				if(move === undefined){
					throw "Parse error: no rule for "+A;
				}
				for(var i=move.rule.length-1;i>=0;--i){
					parseStack.push(move.rule[i]);
				}
				semanticStack.push(move.semantics);
			}
			else if(isTerminal(A) && match(scanner.curToken, terminals[A])){	// goofy hack to handle overlapping patterns
				semanticStack.push(scanner.curToken);
				scanner.next();
			}
			else
				throw "Parse error: syntax error near "+A;
		}
		while(parseStack.length > 0){
			var A = parseStack.pop();
			if(A==="&")
				continue;
			if(isNonTerminal(A)){
				var move = production(A, endofinput);
				if(move === undefined)
					throw "Parse error: no rule for "+A;
				for(var i=move.rule.length-1;i>=0;--i)
					parseStack.push(move.rule[i]);
				semanticStack.push(move.semantics);
			}
			else
				break;
		}

		// check
		if(parseStack.length !== 0)
			throw "Syntax error";

		var codeGen = semanticStack.shift();
		output = codeGen(semanticStack);

		return output;
	};

	this.toString = function(){
		var output = "Terminals:\\n";
		var keys = Object.keys(terminals);
		for(var t in keys)
			output += keys[t]+": "+terminals[keys[t]]+"\\n";
		output += "\\nVariables:\\n";
		for(var v in variables)
			output += v+": "+variables[v]+"\\n";
		output += "\\nProductions:\\n";
		for(var c in grammar)
		for(var r in grammar[c])
			output += c+" -> "+grammar[c][r].rule+"\\n";
		return output;
	};
};
