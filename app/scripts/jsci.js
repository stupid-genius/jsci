/*****************************************************
*  JavaScript Compiler Interpreter
*
*	A programmable compiler; think "YACC Interpreter".
*
*	Author: Allen Ng
******************************************************
*	start	- start symbol of grammar
*	end		- end symbol of grammar
*	tokens	- array of tokens
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
function jsci(json){
	var CFG = JSON.parse(json, function(k,v){
		if(k==='semantics'){
			return new Function('stack', v);
		}
		return v;
	});
	/*console.log(JSON.stringify(CFG, function(k,v){
		if(k==='semantics'){
			return v.toString();
		}
		return v;
	}, '\t'));*/

	var start = CFG.start;
	var productions = CFG.productions;
	var variables = Object.keys(productions);
	var terminals = CFG.tokens;
	var reserved = Object.keys(terminals).filter(function(e){
		return e.charAt(0)!=='$';
	}).map(function(e){
		return terminals[e];
	});
	var endofinput = '$';

	function match(a, t){
		var result = false;
		console.log('matching: {{0}}, token: {{1}}, def: {{2}}'.format(a, t, terminals[t]));
		if(a.match(new RegExp(terminals[t]))){
			console.log('{{0}} matches {{1}}'.format(terminals[t], a));
			result = true;
			if(t.charAt(0)==='$'){
				for(var w in reserved){
					if(a.match(new RegExp('^'+reserved[w]+'$'))){
						console.log('{{0}} is reserved: {{1}}'.format(a, reserved[w]));
						result = false;
						break;
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
				console.log('{{0}} is non-terminal'.format(A));
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
				console.log('{{0}} is terminal'.format(a));
				result = true;
				break;
			}
		}
		return result;
	}

	function production(A, a){
		var indicatedRule;
		var epsilonRule;

		var choices = productions[A];
		console.log('choices for {{0}}: {{1}}'.format(A, JSON.stringify(choices)));
		for(var r in choices){
			try{
				var firstTokens = first(choices[r].rule);	//rhs
				console.log('first tokens: {{0}}'.format(firstTokens));
				for(var t in firstTokens){
					if(firstTokens[t]==='&')
						epsilonRule = choices[r];
					if(match(a, firstTokens[t])){
						console.log('{{0}} matched {{1}}'.format(firstTokens[t], a));
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
			console.log('follow tokens: {{0}}'.format(followTokens));
			for(var t in followTokens){
				if(followTokens[t]==='&')		// may be wrong
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
			var firstRules = productions[a];
			for(var r in firstRules){
				var a2;
				for(var i=0; i<firstRules[r].rule.length; ++i){
					a2 = first(firstRules[r].rule.slice(i));
					if(a2[0] !== '&')
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
			throw 'First("{{0}}") contains an unknown symbol.'.format(A);

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
				var choices = productions[variables[v]];
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

	this.parse = function(source){
		console.log(source);
		var output;
		var scanner = new StringScanner(source);
		var parseStack = [];
		var semanticStack = [];

		var keys = Object.keys(terminals);
		for(var t in keys)
			scanner.addToken(keys[t], terminals[keys[t]]);
		console.log(JSON.stringify(scanner, null, '\t'));
		parseStack.push(start);

		while(scanner.hasNext()){
			console.log('[|||] stack: {{0}}; curToken: {{1}}'.format(parseStack, scanner.curToken));
			var A = parseStack.pop();
			if(A==='&'){
				console.log('epsilon');
				continue;
			}
			if(isNonTerminal(A)){
				var move = production(A, scanner.curToken);
				if(move === undefined){
					throw 'Parse error: no rule for {{0}} that produces {{1}}'.format(A, scanner.curToken);
				}
				for(var i=move.rule.length-1;i>=0;--i){
					parseStack.push(move.rule[i]);
				}
				semanticStack.push(move.semantics);
				console.log('found production for non-terminal {{0}} -> {{1}}'.format(A, move.rule));
			}
			else if(isTerminal(A) && match(scanner.curToken, terminals[A])){	// goofy hack to handle overlapping patterns
				console.log('consuming terminal {{0}}'.format(scanner.curToken));
				semanticStack.push(scanner.curToken);
				scanner.next();
			}
			else
				throw 'Parse error: syntax error near {{0}}'.format(A);
		}
		while(parseStack.length > 0){
			var A = parseStack.pop();
			if(A==='&')
				continue;
			if(isNonTerminal(A)){
				var move = production(A, endofinput);
				if(move === undefined)
					throw 'Parse error: no rule for {{0}}'.format(A);
				for(var i=move.rule.length-1;i>=0;--i)
					parseStack.push(move.rule[i]);
				semanticStack.push(move.semantics);
			}
			else
				break;
		}

		// check
		if(parseStack.length !== 0)
			throw 'Syntax error';

		var codeGen = semanticStack.shift();
		output = codeGen(semanticStack);

		return output;
	};

	this.toString = function(){
		var output = 'Start: {{0}}\n'.format(start);
		output += 'Reserved:\n'+reserved.map(function(e){
			return '\t{{0}}\n'.format(e);
		}).join('');
		output += Object.keys(terminals).reduce(function(acc, e){
			return acc+'\t{{0}}: {{1}}\n'.format(e, terminals[e]);
		}, 'Terminals:\n');
		output += Object.keys(variables).reduce(function(acc, e){
			return acc+'\t{{0}}: {{1}}\n'.format(e, variables[e]);
		}, 'Non-terminals:\n');
		output += Object.keys(productions).reduce(function(acc, c){
			return productions[c].reduce(function(coll, r){
				return coll+'\t{{0}} -> {{1}}\n'.format(c, JSON.stringify(r, function(k,v){
					if(k==='semantics'){
						return v.toString();
					}
					return v;
				}));
			}, acc);
		}, 'Productions:\n');
		return output;
	};
};
