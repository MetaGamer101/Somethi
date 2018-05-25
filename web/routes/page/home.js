var fs = require('fs');
var path = require('path');

module.exports = function(req, res){
    fs.readFile(path.join(__dirname, '../../resources/views/home.html'), "utf8", function(err, data){
        if(err) console.log(err);
		data = data.split('{{PATH}}').join(req.originalUrl); 
        res.send(data);
    });
};

