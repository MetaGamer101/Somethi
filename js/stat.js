var c = require('../config.js');
var localStorage = require('node-localstorage').LocalStorage('./dat');
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
                        var input = /<title>Application Error<\/title>/.exec(body);
                        if(input != null){
                            log.warn(u.battleTagName + '#' + u.battleTagNum + ' failed. This is why this api sucks.');
                            badBT = true;
                        }else{
                            //Huh??
                            log.error('Bad battletag on update??? ' + u.battleTagName + '#' + u.battleTagNum);
                            log.error('Here\'s what it said:\n' + body);
                            badBT = true;
                        }
                    }else{
                        throw(e);
                    }
                }
                
                if(data.competitive.rank == undefined){
                    console.log(data);
                    badBT = true;
                }

                if(!badBT){
                    u.rank = data.competitive.rank;
                    if(data.competitive.rank_img == null){
                        u.rankType = 0;
                    }else{
                        u.rankType = parseInt(data.competitive.rank_img.split('')[data.competitive.rank_img.length - 5]);
                    }
                    user.updateUser(u);
                }
            });
        }
    });
};

module.exports.loadOld = function(message, input){
    var oldUsers = JSON.parse(localStorage.getItem('oldusr'));
    for(var i = 0; i < oldUsers.all.length; i++){
        var curr = oldUsers.all[i];
        var u = user.newUserById(curr.discord);
        u.battleTagName = curr.name;
        u.battleTagNum = curr.battleTag;
        u.rank = curr.rank;
        //we dont know the rankType, so assume
        u.rankType = curr.rank == null ? 0 : curr.rank < 1500 ? 1 : curr.rank < 2000 ? 2 : curr.rank < 2500 ? 3 : curr.rank < 3000 ? 4 : curr.rank < 3500 ? 5 : curr.rank < 4000 ? 6 : 7;
        for(var j = 0; j < curr.heroes.length; j++){
            u.heroCode = hero.toggle(u.heroCode, curr.heroes[j]).heroCode;
        }
        user.save(u);
    }
}

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