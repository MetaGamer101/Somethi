var c = require('../config.js');
var user = require('./user.js');
var http = require('http');
var log = require('./log.js');
var hero = require('./hero.js');
module.exports.update = function(){
    //Get stat information for each user with an attached account
    user.each(u => {
        if(u.battleTagName != null && u.battleTagName.length > 0){
            log.info('updating ' + u.battleTagName);
            getData(u.platform, u.region, u.battleTagName, u.battleTagNum, body => {
                log.info('data recieved for ' + u.battleTagName);
                var data;
                var badBT = false;
                try{
                    data = JSON.parse(body);
                } catch(e){
                    if(e instanceof SyntaxError){
                        //Huh??
                        log.error('Bad battletag on update??? ' + u.battleTagName + '-' + u.battleTagNum);
                        log.error('Here\'s what it said:\n' + body);
                        badBT = true;
                    }else{
                        throw(e);
                    }
                }

                if(!badBT){
                    u.rank = data.competitive.rank;
                    u.rankType = parseInt(data.competitive.rank_img.split('')[data.competitive.rank_img.length - 5]);
                    user.updateUser(u);
                }
            });
        }
    });
};

module.exports.listHeros = function(message, input){
    var heros = hero.getHeros(user.get(message.author).heroCode);
    if(heros.length == 0){
        message.channel.send("No heros!");
    }else{
        var res = "";
        for(var i = 0; i < heros.length; i++){
            res += heros[i].name + "\n"
        }   
        message.channel.send(res);

    }
    
}

module.exports.addHero = function(message, input){
    var u = user.get(message.author);
    var toggleData = hero.toggle(u.heroCode, input[1]);
    if(toggleData.newStatus == null){
        message.channel.send("Could not add hero");
    }else if(toggleData.newStatus){
        message.channel.send(input[1] + " has been turned **on**.");
    }else{// !u.newStatus
        message.channel.send(input[1] + " has been turned **off**.");
    }
    u.heroCode = toggleData.heroCode;
    user.updateUser(u);
}

module.exports.refresh = function(){
    var channel = c.bot.guilds.get(c.guildId).channels.get(c.statInfo);
    channel.fetchMessages().then(messages => {
        messages.forEach(message => {
           message.delete();
        });
    });
    var str = "STAT INFO:\n";
    var users = user.all();
    for(var i = 0; i < users.length; i++){
        str += users[i].battleTagName;
        str += "#";
        str += users[i].battleTagNum;
        str += ": ";
        str += users[i].rank;
        str += '\n';
    }
    channel.send(str);
}

module.exports.add = function(message, input){
    var battleTagName = input[2];
    var battleTagNum = input[3];
    var u = user.get(message.author);
    u.battleTagName = battleTagName;
    u.battleTagNum = battleTagNum;
    user.updateUser(u);
    log.info('Added STATS listing for ' + battleTagName + '#' + battleTagNum);
}

function getData(platform, region, battleTagName, battleTagNum, cb){
    http.get('http://ow-api.herokuapp.com/profile/' + platform + '/' + region + '/' + battleTagName + '-' + battleTagNum, res => {
        res.setEncoding("utf8");
        var body = "";
        res.on("data", data => {
            body += data;
        });
        res.on("end", () => {
            cb(body);
        });
    });
}