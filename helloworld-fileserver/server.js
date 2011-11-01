var http	= require('http'),
	fs		= require('fs'),
	url		= require('url'),
	path	= require('path');
http.createServer(function(req, res) {
	var filename = '.' + url.parse(req.url).pathname;
	if (filename == './') filename = 'index.html';
	path.exists(filename, function(exists) {
		if (!exists) {
			res.writeHeader(404, {"Content-type": "text/plain"});
			res.write('Error 404: File not found');
			res.end();
			return;
		}
		fs.readFile(filename, 'utf8', function(error, file) {
			if (error) {
				res.writeHeader(500, {"Content-type": "text/plain"});
				res.write('Internal File Error');
				res.end();
				return;
			}
			res.writeHeader(200, {"Content-type": "text/html"});
			res.write(file, 'utf8');
			res.end();
		});
	});
}).listen(8080);