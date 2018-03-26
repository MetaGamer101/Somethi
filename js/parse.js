var https = require('https');
var cheerio = require('cheerio');

module.exports.getData = function(platform, region, battleTagName, battleTagNum, callback){
    var url;
    
    //currently, only pc is supported
    url = "https://playoverwatch.com/en-us/career/pc/" + battleTagName + "-" + battleTagNum;
    url = encodeURI(url);
    
    https.get(url, res => {
        res.setEncoding("utf8");
        var html = "";
        res.on("data", data => {
            html += data;
        });
        res.on("end", () => {
            //PARSE
            const $ = cheerio.load(html);
            var test = $('.u-align-center').first().text();
            if(test == "Profile Not Found"){
                return null;
            }
            var res = {};
            res.username = $('.header-masthead').text();
            res.level = $('.u-vertical-center').first().text();
            res.rank = null;
            res.portrait = null;
            var comp = $('.competitive-rank');
            if(comp != null){
                res.rank = $('.competitive-rank div').first().text();
                var portraitImage = $('.competitive-rank img').attr('src');
                if(portraitImage){
                    res.portrait = portraitImage.split('')[portraitImage.length - 5];
                }else{
                    res.portrait = 0;
                }
            }
            callback(res);
        });
    });
}