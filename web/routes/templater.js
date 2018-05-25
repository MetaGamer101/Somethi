var ejs = require('ejs');
var fs = require('fs');

module.exports = function(view){
	return function(req, res){
		fs.readFile(view, 'utf8', function(err, data){
			if(err) throw err;
			var parsed = ejs.render(data, req.ejs);
			res.send(parsed);
		});
	};	
};
