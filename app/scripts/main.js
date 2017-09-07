// jshint devel:true
'use strict';

var terminalModule = angular.module('TerminalModule', ['ServicesModule']);
var servicesModule = angular.module('ServicesModule', []);

terminalModule.controller('ConsoleController', ['$scope', 'ExecutorService', 'DocumentService', function($scope, executor, DocumentService){
	var terminalPanel = $('#terminal');
	var settings = {
		prompt: '> ',
		name: 'terminal',
		greetings: 'stupid-genius.com'
		/*keypress: function(e) {
			if (e.which === 96) {
				// return false;
			}
		}*/
	};
	terminalPanel.terminal = terminalPanel.terminal(executor.exec, settings);
    terminalPanel.terminal.focus(true);

	terminalPanel.terminal.stdout = terminalPanel.terminal.echo;
	terminalPanel.terminal.stdin = window.prompt;
	terminalPanel.terminal.mode = function(mode){
		var args = [].slice.call(arguments, 1);
		$scope.$apply(function(){
			var term = terminalPanel.terminal;
			$scope.mode = mode;
			switch($scope.mode){
			case 'editor':
				term.pause();
				var doc = '';
				if(args[0]!==undefined && args[0]!==''){
					try{
						doc = DocumentService.read(args);
					}
					catch(e){
						term.resume();
						delete $scope.mode;
						term.echo(e);
						return;
					}
				}
				editor.setSession(ace.createEditSession(doc));
				// editor.focus();	// this seems to cause the terminal to focus as well
			default:
				term.resume();
				// term.focus(true);	// this seems to do nothing
			}
		});
	};

	function vimNotify(cm, text){
		cm.openNotification('<span style="color: red">' + text + '</span>', {bottom: true, duration: 4999});
	}
	var editor = ace.edit('aceEditor');
	editor.setTheme('ace/theme/terminal');
	editor.setKeyboardHandler('ace/keyboard/vim');
	ace.config.loadModule('ace/keyboard/vim', function(module){
		var vim = module.CodeMirror.Vim;
		vim.defineEx('ls', 'ls', function(cm, input){
			vimNotify(cm, 'list');
		});
		vim.defineEx('write', 'w', function(cm, input){
			if(input.args===undefined){
				vimNotify(cm, 'usage: \<path\>');
				return;
			}
			var doc = editor.getValue();
			DocumentService.update(input.args, doc);
			vimNotify(cm, 'saved');
		});
		vim.defineEx('open', 'o', function(cm, input){
			vimNotify(cm, 'open');
		});
		vim.defineEx('quit', 'q', function(cm, input){
			editor.setSession();
			terminalPanel.terminal.mode();
		});
	});
}]);

terminalModule.service('ExecutorService', ['commandRegistry', 'DocumentService', Executor]);
function Executor(registry, DocumentService){
    this.exec = function(input, terminal){
        var terms = input.trim().split(/\s+/);
		var progPat = /^\.\/(.+)/;
        var cmd = terms[0];
		if(progPat.test(cmd)){
			var prog = cmd.replace(progPat, '$1');
			cmd = new Function(DocumentService.read(prog));
		}
		else{
			cmd = registry[cmd];
		}
        if(typeof(cmd)!=='function'){
			return terms[0]+': no such command';
        }

        // possible dependency injection
        //var args = /^function\s*\(\s*(.*)\s*\)(?=\s*\{)/.exec(cmd.toString())[1].split(/\s*,\s*/);

        /*
        *   TODO ideas
        *   - ability to run scripts (fs, localstorage, url)
        *   - implement better built-in cmds
        *   - can I spawn Executors in WebWorkers?
        */

        var resp = cmd.apply(terminal, terms.slice(1));
		if(resp instanceof Object){
            terminal.echo(JSON.stringify(resp, null, 1));
        }
        else{
            terminal.echo(resp);
        }
    };

    return this;
}
var commandRegistry = function(DocumentService, builtin){
	var registry = {
		cas: function(){
			return 'Computer Algebra System';
		},
		echo: function(){
			return [].slice.call(arguments).join(' ');
		},
		help: function(){
			return Object.keys(registry);
		},
		js: function(){
			this.push(function(command, term){
				if(command !== ''){
					try{
						var result = window.eval(command);
						if(result !== undefined){
							term.echo(new String(result));
						}
					}
					catch(e){
						term.error(new String(e));
					}
				}
				else{
					term.echo('');
				}
			}, {
				name: 'js',
				prompt: 'js> '
			});
			return '';
		},
	    jsci: function(){
			var args = [].slice.call(arguments);
			var switchPat = /^\-(\w+).*/;
			var i = 0;
			while(switchPat.test(args[i])){
				var switchArg = args[i++].replace(switchPat, '$1');
				switch(switchArg){
				case 'h':
				case '-help':
					return 'usage: jsci [-o <output file>][-r][-l] <grammar> <source>';
				case 'o':
					args.outputFile = args[i++];
					break;
				case 'r':
				case '-run':
					args.immediate = true;
					break;
				case 'l':
				case '-ls':
					args.listing = true;
					break;
				default:
					return 'unrecognized switch';
				}
			}
			var grammarPath = args[i++];
			var sourcePath = args[i++];

			try{
				var grammar = DocumentService.read(grammarPath);
				var parser = new jsci(grammar);
				if(args.listing){
					this.echo(parser.toString());
				}
				var source = DocumentService.read(sourcePath);
				var out = parser.parse(source)+'return "";';
				if(args.outputFile){
					DocumentService.update(args.outputFile, out);
				}
				if(args.immediate){
					var prog = new Function(out);
					this.push(function(input, term){
						term.echo(prog.call(term, input));
						term.pop();
					});
					this.exec('', true);
				}
				return out;
			}
			catch(e){
				console.error('jsci: ', e);
				return 'jsci error';
			}
	    },
		ls: function(){
			return (localStorage['DocumentService:/']+builtin).split(/;/).filter(function(e){return e!==''});
		},
	    vim: function(){
			var path = [].slice.call(arguments).join(' ');
			this.mode('editor', path);
			return '';
	    }
	};
	return registry;
};
terminalModule.factory('commandRegistry', ['DocumentService', 'BuiltinDocuments', commandRegistry]);

servicesModule.value('DocumentRoot', 'DocumentService:/');
servicesModule.value('BuiltinDocuments', ';grammar.tiny;example.tiny;readme.md');
servicesModule.service('FileService', function(){
	this.get = function(name){
		return $.ajax({
			url: '/files/'+name,
			async: false,
		}).responseText;
	};
});
servicesModule.service('DocumentService', ['DocumentRoot', 'FileService', DocumentService]);
function DocumentService(fsRoot, files){
	if(localStorage[fsRoot]===undefined){
		localStorage[fsRoot] = '';
	}
	var self = this;

	this.create = function(path, doc){
		if(localStorage[path]!==undefined){
			throw 'Can\'t create doc; "{0}" already exists'.format(path);
		}
		localStorage[path] = doc;
		localStorage[fsRoot] += ';'+path;
		// var dirs = path.split(/\//);
	};
	this.read = function(path){
		var doc = localStorage[path];
		if(doc === undefined){
			var file = files.get(path);
			if(file === undefined){
				return 'Document "{{0}}" not found'.format(path);
			}
			else{
				return file;
			}
		}
		return doc;
	};
	this.update = function(path, doc){
		if(localStorage[path]===undefined){
			self.create(path, doc);
		}
		else{
			localStorage[path] = doc;
		}
	};
	this.delete = function(path){
		//TODO remove from dir
		delete localStorage[path];
	};
	this.find = function(target){	//find a given thing
	};
	this.search = function(path, filter){	// search a given location
	};
}
if(!String.prototype.format){
	String.prototype.format = function(){
		var args = arguments;
		return this.replace(/{{(\d+)}}/g, function(match, number){
			return args[number] || '';
		});
	};
}