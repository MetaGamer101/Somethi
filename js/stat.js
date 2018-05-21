var c = require('../config.js');
var localStorage = require('node-localstorage').LocalStorage('./dat');
var user = require('./user.js');
var http = require('http');
var log = require('./log.js');
var hero = require('./hero.js');
var team = require('./team.js');
var parse = require('./parse.js');

var rankEmojis = [
	"445071071591530518", //unranked
	"445067370550132747", //bronze
	"445067371997036557", //silver
	"445067372144099338", //gold
	"445067373695860736", //platinum
	"445067371024220160", //diamond
	"445067373574225931", //master
	"445067373561511937"  //grandmaster
];

var needsRefresh = true;

var top5emoji = "447867125227323402";
var showTop5 = false;

module.exports.rankEmojis = rankEmojis;

module.exports.update = function(){
	log.info('stat.js update');
    log.info('updating all');
    var firstRun = user.all();
    updateUsers(firstRun, secondRun => {
//		if(secondRun.length > 0){
//			log.info('second update wave');
//			updateUsers(secondRun, thirdRun => {
//				if(thirdRun.length > 0){
//				log.info('third update wave');
//				updateUsers(thirdRun, bad => {
//				log.info('finished update!');
//					if(bad.length > 0){
//						log.warn('the following did not return after three tries');
//						for(var i = 0; i < bad.length; i++){
//							log.warn(bad[i].battleTagName + '#' + bad[i].battleTagNum);
//						}
//					}
//				});
//			}else{
//				log.info('finished update!');
//			}	
//			});
//		}else{
//			log.info('finished update!');
//		}	
		log.info('update completed with ' + secondRun.length + ' users with errors!');
		for(var i = 0; i < secondRun.length; i++){
			log.warn(secondRun[i].battleTagName + '#' + secondRun[i].battleTagNum + ' had errors!');
		}
		refresh();
	});
}

function updateUsers(ulist, callBack){
	log.info('stat.js updateUsers(ulist(len:' + ulist.length + '), callback)');
    //Get stat information for each user with an attached account
    var left = ulist.length;
    var broken = [];
    ulist.forEach(u => {
	log.info('running for ' + u.guildMemberId + ' bnet: ' + u.battleTagName + '#' + u.battleTagNum);
        if(u.battleTagName != null && u.battleTagName.length > 0){
            parse.getData(u.platform, u.region, u.battleTagName, u.battleTagNum, data => {
                var badBT = false;
                if(data == null){
                    log.error('Seems like ' + u.battleTagName + '#' + u.battleTagNum + ' changed their name!');
                    badBT = true;
                }

                if(!badBT){
		    log.info('success!');
					var oldU = JSON.stringify(u);
                    u.rank = data.rank;
					var newU = JSON.stringify(u);
					if(oldU != newU) needsRefresh = true;
                    u.rankType = data.portrait;
                    user.updateUser(u);
                }
                left--;
                if(left == 0){
                    callBack(broken);
                }
            });
        }else{
            log.warn('null user: ' + u.guildMemberId);
            left--;
            if(left == 0){
                callBack(broken);
            }
	   }
    });
};

module.exports.loadOld = function(message, input){
	log.info('stat.js loadOld');
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
	log.info('stat.js listHeroes');
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
	log.info('stat.js addHero');
    log.info('adding hero ' + message.author.id);
    var u = null;
    if(input[4] == undefined || user.isMod(message.author.id)){
        u = user.get(message.author);
    }else{
        u = user.getById(input[4]);
    }
    var toggleData = hero.toggle(u.heroCode, input[2]);
    if(toggleData.newStatus == null){
        message.channel.send("Could not add hero");
    }else if(toggleData.newStatus){
	log.info('result turned on');
        message.channel.send(input[2] + " has been turned **on**.");
    }else{// !u.newStatus
	log.info('result turned off');
        message.channel.send(input[2] + " has been turned **off**.");
    }
    u.heroCode = toggleData.heroCode;
    user.updateUser(u);
	needsRefresh = true;
}
module.exports.refresh = refresh;
function refresh(){
	log.info('stat.js refresh');
	if(!needsRefresh){
		log.info('did not need refresh');
		return;
	}
	needsRefresh = false;
    log.info('refreshing stat info');
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
	var inT5 = 0
    for(var i = 0; i < users.length; i++){
        if(users[i].rank == undefined || users[i].rank == 0) continue;
        var str = "";
        str += getSingleUserLine(users[i], (showTop5 && (inT5 < 5)));
		if(inT5 < 5){
			inT5++;
		}
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
        if(strs[i].length != 0)channel.send(strs[i]);
    }
}

function getSingleUserLine(u, top5){
	if(top5 == undefined) top5 = false;
    var str = "";
    str += c.bot.emojis.get(rankEmojis[u.rankType]);
    str += " ";
    var rankStr = "`";
    if(u.rank == null || u.rank == '') rankStr += "----";
    else if(u.rank < 10) rankStr += "---" + u.rank.toString();
    else if(u.rank < 100) rankStr += "--" + u.rank.toString();
    else if(u.rank < 1000) rankStr += "-" + u.rank.toString();
    else rankStr += u.rank.toString();
    rankStr += "`";
    str += rankStr;
	if(top5){
		str += " ";
		str += c.bot.emojis.get(top5emoji);
	}
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
	log.info('stat.js add');
    var battleTagName = input[2];
    var battleTagNum = input[3];
    log.info(battleTagName + '#' + battleTagNum);
    var u = null;
    if(input[5] == undefined){
		u = user.get(message.author);
		if(u == null){
			u = user.newUser(message.author);
		}
    }else{
	u = user.getById(input[5]);
	if(u == null){
            u = user.newUserById(input[5]);
        }
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
    user.updateUsernameById(u.guildMemberId);
    log.info('Added STATS listing for ' + battleTagName + '#' + battleTagNum);
    message.channel.send('Added STATS listing for ' + battleTagName + '#' + battleTagNum);
}

function getData(platform, region, battleTagName, battleTagNum, cb){
	log.info('stat.js getData(' + platform + ', ' + region + ', ' + battleTagName + '#' + battleTagNum + ', callback)');
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
