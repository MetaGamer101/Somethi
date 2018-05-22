var fs = require('fs');
var path = require('path');

module.exports = function(req, res){
    fs.readFile(path.join(__dirname, '../../resources/views/reference.html'), "utf8", function(err, data){
        if(err) console.log(err);
        res.send(data);
    });
};

