//
//
//		Basic Node Asset Server
//		by Marc Qualie
//		
//

var http	= require('http'),
	fs		= require('fs'),
	url		= require('url'),
	path	= require('path');

// Global Vars
var server_port = 8080;
var server_addr = '0.0.0.0';
var docroot = '.';
var filetypes = ['html', 'ico', 'css', 'js', 'jpg', 'png', 'gif'];

// Server Instance
var server = http.createServer(function(req, res) {
	
	// Parse Filename
	var filename = url.parse(req.url).pathname;
	if (filename == '/') filename = '/index.html';
	var ext = filename.split('.').pop();
	console.log('Incoming request for ' +  filename + ' (' + ext + ')');
	
	// Only accept requests for certain filetypes
	if (filetypes.indexOf(ext) < 0) {
		res.writeHeader(403, {"Content-type": "text/plain"});
		res.write('Error 403: Server does not support that file type (' + ext + ')');
		res.end();
		return;
	}
	
	// Block access to directories
	if (filename.substr(-1, 1) == '/') {
		res.writeHeader(403, {"Content-type": "text/plain"});
		res.write('Error 403: Directory indexes are forbidden');
		res.end();
		return;
	}
	
	// Send file to client
	path.exists(docroot + filename, function(exists) {
		if (!exists) {
			res.writeHeader(404, {"Content-type": "text/plain"});
			res.write('Error 404: File not found');
			res.write(filename);
			res.end();
			return;
		}
		if (ext == 'html') {
			fs.readFile(docroot + filename, 'utf8', function(error, file) {
				if (error) {
					res.writeHeader(500, {"Content-type": "text/plain"});
					console.log(error);
					res.write('Internal File Error:', error.toString());
					res.end();
					return;
				}
				res.writeHeader(200, {"Content-type": "text/html"});
				file = parseNodeMarkup(file, req);
				res.write(file, 'utf8');
				res.end();
			});
		} else {
			fs.readFile(docroot + filename, 'binary', function(error, file) {
				if (error) {
					res.writeHeader(500, {"Content-type": "text/plain"});
					console.log(error);
					res.write('Internal File Error:', error.toString());
					res.end();
					return;
				}
				res.writeHeader(200);
				res.write(file, 'binary');
				res.end();
			});
		}
	});
	
}).listen(server_port, server_addr);



// Node Markup Parsing
function parseNodeMarkup(html, req) {
	
	// Simple node holders
	html = html.replace('<node:remoteAddr/>', req.socket.remoteAddress);
	
	// Get Directory Listings
	if (html.indexOf('<node:files') > -1) {
		var tagStart = html.indexOf('<node:files');
		var markupStart = html.indexOf(">", tagStart) + 3;
		var markupEnd = html.indexOf("</node:files>", markupStart);
		var tagEnd = markupEnd + 15;
		var allMarkup = html.substr(tagStart, tagEnd - tagStart);
		var fileMarkup = html.substr(markupStart, markupEnd - markupStart);
		var dirpath = '/images';
		var tempHtml = '';
		var files = fs.readdirSync(docroot + dirpath);
		for (var i = 0, l = files.length; i < l; i++) {
			var file = files[i];
			var fileHtml = fileMarkup;
			fileHtml = fileHtml.replaceAll('<file:url/>', dirpath + '/' + file);
			fileHtml = fileHtml.replaceAll('<file:name/>', file);
			tempHtml += fileHtml;
		}
		html = html.replace(allMarkup, tempHtml);
//		html = html.replaceAll('<node:filecount/>', files.length);
	}
	return html;
}



// Extend Prototypes
String.prototype.replaceAll = function(org, rep) {
	var s = this;
	if (org == rep) return s;
	while (s.indexOf(org) > -1) s = s.replace(org, rep);
	return s;
}

// Start listening
console.log('Node Server started [' + server_addr + ':' + server_port + ']');