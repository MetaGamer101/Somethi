var fs = require('fs');
var path = require('path');

module.exports = function(req, res){
    var file = path.join(__dirname, '../resources/web/', req.path);
    fs.readFile(file, "utf8", function(err, data){
        if(err) console.log(err);
        res.send(data);
    });

};

