/**********************************
*	JavaScript utility functions
*	written by: Allen Ng
***********************************/

/*
*	adds trim functionality to built-in String object
*/
String.prototype.trim = function()
{
	return this.replace(/^\s+|\s+$/g,"");
}
String.prototype.ltrim = function()
{
	return this.replace(/^\s+/,"");
}
String.prototype.rtrim = function()
{
	return this.replace(/\s+$/,"");
}

/*
*	represents a "line file" -- a file
*	intended to be processed one line
*	at a time.
*/
function JSLineFile(relURL)
{
	var lineFile;
	var iLine;
	$.ajax(
	{
		url: relURL,
		async: false,
		cache: false
	}).done(function(html)
	{
		lineFile = html.split(/\r\n/);
		iLine = 0;
	});
	this.hasNext = function()
	{
		return iLine<lineFile.length;
	}
	this.nextLine = function()
	{
		return lineFile[iLine++];
	}
}
/*
*	imports code using XHConn and JavaScript's eval()
*/
function JScode()
{
	var nameStack = new Array();
	this.jsDelcare = function(relURL)
	{
		var header = new JSLineFile(relURL);

		while(header.hasNext())
		{
			nameStack.push(header.nextLine());
		}
	}
	this.jsImport = function(relURL)
	{
		var script = new XHConn();
		script.connect(location.protocol+"//"+location.hostname+"/"+relURL, "GET", null, JSprocessInclude);
		function JSprocessInclude(http_request)
		{
			if(http_request.status == 200)
			{
				eval(http_request.responseText);
				while(nameStack.length>0)
				{
					var sFnName = nameStack.pop();
					eval("this."+sFnName+"="+sFnName);
				}
			}
			else
			{
				alert('There was a problem with the request. ' + http_request.status);
			}
		}
	}
}

/*
*	loads an XML file
*	adds XSLT capability
*/
function JSXML(fileURL)
{
	this.xmlDoc;
	// code for IE
	if(window.ActiveXObject)
	{
		this.xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
	}
	// code for Mozilla, Firefox, Opera, etc.
	else if(document.implementation && document.implementation.createDocument)
	{
		this.xmlDoc = document.implementation.createDocument("","",null);
	}
	else
	{
		alert('Your browser cannot handle this script');
	}
	this.xmlDoc.async=false;
	if(fileURL != null)
		this.xmlDoc.load(fileURL);

	/*
	*	performs XSLT on the XML document the function is a property of
	*	is called via JSloadXML.xslt()
	*	precondition: this == JSloadXML()
	*/
	this.xslt = function(styleSheetURL, element)
	{
		var xsl = new JSXML(styleSheetURL);
			
		// code for IE
		if(window.ActiveXObject)
		{
			var result = this.xmlDoc.transformNode(xsl.xmlDoc);
			document.getElementById(element).innerHTML = result;
		}
		// code for Mozilla, Firefox, Opera, etc.
		else if(document.implementation && document.implementation.createDocument)
		{
			var xsltProcessor = new XSLTProcessor();
			xsltProcessor.importStylesheet(xsl.xmlDoc);
			var fragment = xsltProcessor.transformToFragment(this.xmlDoc, document);
			document.getElementById(element).appendChild(fragment);
		}
	}
}

/*
*	polls an applet for output directed to JavaScript
*	The applet must implement:
*	public boolean JShasNext(String);
*	public String JSnext(String);

	wrong!  Fix delim pattern
*/
function JSappletScanner(appletElement)
{
	var applet = appletElement;
	var cDelimiter = "\\s";
	var sCompDelimPat = "\\s*[^\\s]+\\s*";

	this.getDelim = function()
	{
		return cDelimiter;
	}
	this.setDelim = function(newDelim)
	{
		cDelimiter = newDelim;
		sCompDelimPat = cDelimiter+"*[^"+cDelimiter+"]+"+cDelimiter+"*";
	}

	this.hasNext = function()
	{
		return applet.jsHasNext(sCompDelimPat);
	}
	this.hasNextExp = function(pattern)
	{
		return applet.jsHasNext(pattern);
	}
	this.next = function()
	{
		return applet.jsNext(sCompDelimPat);
	}
	this.nextExp = function(pattern)
	{
		return applet.jsNext(pattern);
	}
}