var c = require('../config.js');
var localStorage = require('node-localstorage').LocalStorage('./dat');
var user = require('./user.js');
var http = require('http');
var log = require('./log.js');
var hero = require('./hero.js');
var team = require('./team.js');

var rankEmojis = [
	"419514920443576331", //unranked
	"292658692069785600", //bronze
	"292658692162322432", //silver
	"292658691784704002", //gold
	"292658692296540160", //platinum
	"292658692518576139", //diamond
	"292658692673765376", //master
	"292658692724097024"  //grandmaster
];

module.exports.rankEmojis = rankEmojis;

module.exports.update = function(){
    log.info('updating all');
    var firstRun = user.all();
    updateUsers(firstRun, secondRun => {
   	if(secondRun.length > 0){
	    log.info('second update wave');
	    updateUsers(secondRun, thirdRun => {
	        if(thirdRun.length > 0){
		    log.info('third update wave');
		    updateUsers(thirdRun, bad => {
			log.info('finished update!');
                if(bad.length > 0){
                    log.warn('the following did not return after three tries');
                    for(var i = 0; i < bad.length; i++){
                        log.warn(bad[i].battleTagName + '#' + bad[i].battleTagNum);
                    }
                }
		    });
		}else{
		    log.info('finished update!');
		}	
	    });
	}else{
	    log.info('finished update!');
	}	
    });
}

function updateUsers(ulist, callBack){
    //Get stat information for each user with an attached account
    var left = ulist.length;
    var broken = [];
    ulist.forEach(u => {
        if(u.battleTagName != null && u.battleTagName.length > 0){
            getData(u.platform, u.region, u.battleTagName, u.battleTagNum, body => {
                var data;
                var badBT = false;
                try{
                    data = JSON.parse(body);
                } catch(e){
                    if(e instanceof SyntaxError){
                        var input = /<title>Application Error<\/title>/.exec(body);
                        if(input != null){
                            badBT = true;
			    broken.push(u);
                        }else{
                            //Huh??
                            log.error('Bad battletag on update??? ' + u.battleTagName + '#' + u.battleTagNum);
                            log.error('Here\'s what it said:\n' + body);
                            badBT = true;
			    broken.push(u);
                        }
                    }else{
                        log.error('json perse error was NOT syntax!');
                        throw(e);
                    }
                }
                
                if(!badBT && data.competitive == undefined){
                    log.error('Seems like ' + u.battleTagName + '#' + u.battleTagNum + ' changed their name!');
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
                left--;
                if(left == 0){
                    callBack(broken);
                }
            });
        }else{
	    log.warn('null user: ' + u.guildMemberId);
	    left --;
	    if(left == 0){
		callBack(broken);
	    }
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

module.exports.listHeroes = function(message, input){
    var heroes = hero.getHeroes(user.get(message.author).heroCode);
    if(heroes.length == 0){
        message.channel.send("No heroes!");
    }else{
        var res = "";
        for(var i = 0; i < heroes.length; i++){
            res += heroes[i].name + "\n"
        }   
        message.channel.send(res);

    }
    
}

module.exports.addHero = function(message, input){
    var u = user.get(message.author);
    var toggleData = hero.toggle(u.heroCode, input[2]);
    if(toggleData.newStatus == null){
        message.channel.send("Could not add hero");
    }else if(toggleData.newStatus){
        message.channel.send(input[2] + " has been turned **on**.");
    }else{// !u.newStatus
        message.channel.send(input[2] + " has been turned **off**.");
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
    var strs = [];
    strs.push("**Nexus Player Stats**\n");
    var users = user.all();
    users.sort(function(a, b){
	   return b.rank - a.rank;
    });
    var tmpstr = "";
    for(var i = 0; i < users.length; i++){
        if(users[i].rank == undefined || users[i].rank == 0) continue;
        var str = "";
        str += getSingleUserLine(users[i]);
        str += "\n";
        if((tmpstr + str).length > 2000){
                strs.push(tmpstr);
            tmpstr = str;
        }else{
                tmpstr += str;
        }
    }
    strs.push(tmpstr);
    for(var i = 0; i < strs.length; i++){
        channel.send(strs[i]);
    }
}

function getSingleUserLine(u){
    var str = "";
    str += c.bot.emojis.get(rankEmojis[u.rankType]);
    str += " ";
    var rankStr = "`";
    if(u.rank == null) rankStr += "----";
    else if(u.rank < 10) rankStr += "000" + u.rank.toString();
    else if(u.rank < 100) rankStr += "00" + u.rank.toString();
    else if(u.rank < 1000) rankStr += "0" + u.rank.toString();
    else rankStr += u.rank.toString();
    rankStr += "`";
    str += rankStr;
    str += " ";
    str += u.battleTagName;
        str += "#";
        str += u.battleTagNum;
    var heroes = hero.getHeroes(u.heroCode);
        for(var j = 0; j < heroes.length; j++){
            str += c.bot.emojis.get(heroes[j].emoji);
    }
    return str;
}

module.exports.getSingleUserLine = getSingleUserLine;

module.exports.add = function(message, input){
    var battleTagName = input[2];
    var battleTagNum = input[3];
    var u = user.get(message.author);
    if(u == null){
        u = user.newUser(message.author);
    }
//    try{
//        var b = false;
//        for(var i = 0; i < team.all().length; i++){
//            if(team.captian == message.author.id){
//                b = true;
//            }
//        }
//        if(b){
//            message.member.setNickname('[★] ' + input[2]);
//        }else{
//            message.member.setNickname(input[2]);
//        }
//    }catch(e){
//        log.error('probably because is admin');
//        log.error(e);
//    }
    u.battleTagName = battleTagName;
    u.battleTagNum = battleTagNum;
    user.updateUser(u);
    user.updateUsernameById(message.author.id);
    log.info('Added STATS listing for ' + battleTagName + '#' + battleTagNum);
    message.channel.send('Added STATS listing for ' + battleTagName + '#' + battleTagNum);
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
