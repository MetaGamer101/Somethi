var localStorage = require('node-localstorage').LocalStorage('./dat');
var log = require('./log.js');
var user = require('./user.js');
var stat = require('./stat.js');
var c = require('../config.js');

var teams = [];

var bannedTeamNames = [
];

var teamTemplate = {
    "name": null,
    "captain": null,
    "members": [],
    "subs": [],
    "color": null,
    "text": null,
    "voice": null,
    "role": null
};

module.exports.start = function(){
	log.info('team.js start');
//    console.log(c.Discord.Permissions.FLAGS);
    teams = JSON.parse(localStorage.getItem('teams'));
    var keys = Object.keys(teamTemplate);
    if(teams != null){
        var changed = false;
        for(var i = 0; i < teams.length; i++){
            for(var j = 0; j < keys.length; j++){
                if(!(keys[j] in teams[i])){
                    teams[i][keys[j]] = teamTemplate[keys[j]];
                    changed = true;
                }
            }
        }
        if(changed){
            log.info('team object updated! current teams modified.');
            save();
        }
    }else{
        teams = [];
    }
}

module.exports.save = save;

function save(){
	log.info('team.js save');
    localStorage.setItem('teams', JSON.stringify(teams));
}

module.exports.all = function(){
	log.info('team.js all');
    return teams;
}

function isCaptain(id, teamCap){
	log.info('team.js isCaptain(' + id + ', ' + teamCap + ')');
    if(user.isMod(id)) return true;
    if(id == teamCap) return true;
    return false;
}

module.exports.isCaptain = isCaptain;

function indexByName(name){
	log.info('team.js indexByName(' + name + ')');
    for(var i = 0; i < teams.length; i++){
        if(teams[i].name == name){
            return i;
        }
    }
    return null;
}

function getByName(name){
	log.indo('team.js getByName(' + name + ')');
    for(var i = 0; i < teams.length; i++){
	log.info("\"" + name + "\"" + ' == ' + "\"" + teams[i].name + "\"");
        if(teams[i].name == name){
            return teams[i];
        }
    }
    return null;
}

function updateTeam(team){
	log.info('team.js updateTeam(\'' + team.name + '\')');
    var i = indexByName(team.name);
    teams[i] = team;
    save();
}

function getStats(team){
	log.info('getStats(\'' + team.name + '\')');
    var res = {
        "ranks": [],
        "teamsr": 0,
        "maxsr": -1,
        "minsr": -1,
        "cap": null,
        "members": [],
        "subs": []
    };
    
    var srdiv = 0;
    
    var i = -1;
    var j = 0;
    while(i < team.members.length || j < team.subs.length){
        var usr = null;
		//include no rank as a rank in the rankstr
		if(usr == undefined || usr == null || usr.rank == null || usr.rank == ''){
			var indd = res.ranks.indexOf(0);
			if(indd <= -1){
				res.ranks.push(0);	
			}	
		}
        if(i == -1){
            usr = user.getById(team.captain);
            i++;
            if(usr == undefined || usr == null) continue;
            res.cap = usr;
            if(usr.rank == null || usr.rank == '') continue;
        }else if(i < team.members.length){
            usr = user.getById(team.members[i]);
            i++;
            if(usr == undefined || usr == null) continue;
            res.members.push(usr);
            if(usr.rank == null || usr.rank == '') continue;
        }else{
            usr = user.getById(team.subs[j]);
            j++;
            if(usr == undefined || usr == null) continue;
            res.subs.push(usr);
            if(usr.rank == null || usr.rank == '') continue;
        }
        
        //for max sr
        res.maxsr = Math.max(res.maxsr, usr.rank);
        //for min sr
        res.minsr = res.minsr == -1 ? usr.rank : Math.min(res.minsr, usr.rank);
        //for team sr
        res.teamsr = parseInt(res.teamsr) + parseInt(usr.rank);
        srdiv++;
        
        //for list or ranks
        var ind = res.ranks.indexOf(usr.rankType);
        if(ind <= -1){
            res.ranks.push(usr.rankType);
        }
    }
    
    //get avg
	if(res.teamsr != undefined && res.teamsr != 0) res.teamsr = Math.round(res.teamsr / srdiv);
	else res.teamsr = null;
    
    //sort ranks
    res.ranks.sort(function(a,b){
		if(a == null || a == '') return 1;
		if(b == null || b == '') return -1;
        return b - a;
    });
    
    res.members.sort(function(a, b){
        if(b.rank == null) return -1;
        if(a.rank == null) return 1;
	    return b.rank - a.rank;
    });
    
    res.subs.sort(function(a, b){
	   return b.rank - a.rank;
    });
    
    return res;
}

function getRankStr(ranks){
	log.info('team.js getRankStr(ranks(len:' + ranks.length + '))');
    var ret = "";
    for(var i = 0; i < ranks.length; i++){
        if(i != 0) ret += " / ";
        ret += c.bot.emojis.get(stat.rankEmojis[ranks[i]]);
    }
    return ret;
}

module.exports.getTeam = function(message, input){
	log.info('team.js getTeam');
    var team = getByName(input[1]);
    var teamStats = getStats(team);
    
    var rankStr = getRankStr(teamStats.ranks);
    
    var retStr = "";
    retStr += team.name + ": " + rankStr + "\n";
    retStr += "**" + (teamStats.teamsr == null ? ("Unranked**") : (teamStats.teamsr + "** (" + teamStats.maxsr + " - " + teamStats.minsr + ")")) + "\n";
    if(teamStats.cap != null) retStr += stat.getSingleUserLine(teamStats.cap) + "\n";
    //Members
    for(var i = 0; i < teamStats.members.length; i++){
        if(teamStats.members[i] != null) retStr += stat.getSingleUserLine(teamStats.members[i]) + "\n";
    }
    if(teamStats.subs.length > 0)retStr += "**-SUBS-**" + "\n";
    for(var i = 0; i < teamStats.subs.length; i++){
        if(teamStats.subs[i] != null) retStr += stat.getSingleUserLine(teamStats.subs[i]) + "\n";
    }
    //Subs
    message.channel.send(retStr);
}

module.exports.refresh = function(){
	log.info('team.js refresh');
    var channel = c.bot.guilds.get(c.guildId).channels.get(c.teamInfo);
    channel.fetchMessages().then(messages => {
        messages.forEach(message => {
           message.delete();
        });
    });
    
    var tms = [];
    for(var i = 0; i < teams.length; i++){
        if(teams[i].members.length + teams[i].subs.length >= 3){
            tms.push({
                "team": teams[i],
                "stats": getStats(teams[i])
            });   
        }
    }
    tms.sort(function(a,b){
		if(a.stats.teamsr == null || a.stats.teamsr == '') return 1;
		if(b.stats.teamsr == null || b.stats.teamsr == '') return -1;
        return b.stats.teamsr - a.stats.teamsr;
    });
    var teamstrs = [];
    teamstrs.push("**Nexus Team Stats**");
    var tmpteamstr = "";
    for(var i = 0; i < tms.length; i++){
        var teamLine = getTeamLine(tms[i].team, tms[i].stats);
        if((tmpteamstr + "\n" + teamLine).length > 2000){
            teamstrs.push(tmpteamstr);
            tmpteamstr = "";
        }
        tmpteamstr += (tmpteamstr.length == 0 ? "" : "\n") + teamLine;
    }
    teamstrs.push(tmpteamstr); 
    for(var i = 0; i < teamstrs.length; i++){
        if(teamstrs[i].length != 0)channel.send(teamstrs[i]);
    }
}

function getTeamLine(team, stats){
	log.info('team.js getTeamLine(\'' + team.name + '\', stats)');
    var rankStr = getRankStr(stats.ranks);
    
    var teamrank = "`";
    if(stats.teamsr == null || stats.teamsr.toString() == "NaN") teamrank += "----";
    else if(stats.teamsr < 10) teamrank += "---" + stats.teamsr.toString();
    else if(stats.teamsr < 100) teamrank += "--" + stats.teamsr.toString();
    else if(stats.teamsr < 1000) teamrank += "-" + stats.teamsr.toString();
    else teamrank += stats.teamsr.toString();
    teamrank += "`";
    
    var ret = "";
    ret += teamrank + " " + team.name + " " + rankStr + (stats.maxsr == -1 ? "" : (" (" + stats.maxsr + " - " + stats.minsr + ")"));
    return ret;
}

module.exports.newTeam = function(message, input){
	log.info('team.js newTeam');
    if(input[9] != undefined && !user.isMod(message.author.id)){
        message.channel.send('you cannot specify channels and a role if you are not a mod'); 
	    return;
    }
    if(input[1] == undefined){
        message.channel.send('you forgot a team name!');
    }else{
		log.info('passed first tests');
        for(var i = 0; i < teams.length; i++){
//            if(teams[i].captain == message.author.id){
//                message.channel.sendMessage("You currently cannot create a team if you are captian of another");
//                return;
//            }
            if(teams[i].name.toLowerCase() == input[2].toLowerCase()){
                message.channel.send("A team with that name already exists!");
                return;
            }
            var ind = bannedTeamNames.indexOf(input[2]);
            if(ind > -1){
                message.channel.send("Cannot use a banned team name!");
                return;
            }
        }
		log.info('creating new team!');
        var newTeam = JSON.parse(JSON.stringify(teamTemplate));
        newTeam.captain = message.author.id;
        newTeam.name = input[2];
        if(input[4] != undefined) newTeam.color = input[4];
        if(input[5] != undefined){
            var addUsers = input[5].substr(1, input[5].length).split(' ');
            var b = false;
            for(var i = 0; i < addUsers.length; i++){
                var input2 = /<@!?(\d+)>/.exec(addUsers[i]);
                var index = newTeam.members.indexOf(input2[1]);
                if(index > -1){
                    if(!b){
                        b = true;
                        message.channel.sendMessage("Cannot add the same member twice!");
                    }
                }else{
                    newTeam.members.push(input2[1]);   
                }
            }
        }
        var embed = new c.Discord.RichEmbed()
            .setTitle("Team Created")
            .setColor(newTeam.color == null ? "#34363B" : newTeam.color)
            .addField("Name", input[2])
        ;
        if(newTeam.members.length > 0){
            var membstr = "";
            for(var i = 0; i < newTeam.members.length; i++){
                if(i != 0) membstr += "\n";
                membstr += "<@" + newTeam.members[i] + ">";
            }
            embed.addField("Members", membstr);
        }
        message.channel.send({embed});
        teams.push(newTeam);
        save();
        
        user.updateUsernameById(message.author.id);
        if(input[9] == undefined){ 
            c.bot.guilds.get(c.guildId).createRole({
                'name': newTeam.name,
                'color': newTeam.color,
                'permissions': 0,
                'mentionable': true,
                'hoist': false 
            }).then(role => {
                onTeamRole(role, newTeam, input, message);
            });
        }else{
            newTeam.color = c.bot.guilds.get(c.guildId).roles.get(input[11]).color;
            onTeamRole(c.bot.guilds.get(c.guildId).roles.get(input[11]), newTeam, input, message); 
        }
    }
}

function onTeamRole(role, newTeam, input, message){
	log.info('team.js onTeamRole(' + role.id + ', ' + newTeam.name + ', input, message)');
    newTeam.role = role.id;
    if(input[9] == undefined){
        c.bot.guilds.get(c.guildId).createChannel(newTeam.name, 'text', [
        {
            'deny': 1024, //view channel
            'id': c.everyone
        },
        {
            'allow': 1024, //view channel
            'id': role.id
        }
        ]).then(channel => {
            onTeamText(role, newTeam, channel, input);
        });
    }else{
        onTeamText(role, newTeam, c.bot.guilds.get(c.guildId).channels.get(input[9]), input);
    }
    if(input[10] == undefined){
        c.bot.guilds.get(c.guildId).createChannel(newTeam.name, 'voice', [
        {
            'deny': 1024, //view channel
            'id': c.everyone
        },
        {
            'allow': 1024, //view channel
            'id': role.id
        }
        ]).then(channel => {
            onTeamVoice(role, newTeam, channel, input);
        });
    }else{
        onTeamVoice(role, newTeam, c.bot.guilds.get(c.guildId).channels.get(input[10]), input);
    } 
    c.bot.guilds.get(c.guildId).members.get(newTeam.captain).addRole(role.id);
    for(var i = 0; i < newTeam.members.length; i++){
        c.bot.guilds.get(c.guildId).members.get(newTeam.members[i]).addRole(role.id);
    }
}


function onTeamText(role, newTeam, channel, input){
	log.info('team.js onTeamText(' + role.id + ', ' + newTeam.name + ', ' + channel.id + ', input)');
	channel.setParent(c.tt).then(channel2 => {
	    channel2.overwritePermissions(c.bot.guilds.get(c.guildId).me, {
		    'VIEW_CHANNEL': true
	    }).then(channel3 => {
	        channel3.overwritePermissions(c.everyone, {
		        'VIEW_CHANNEL': false
		    }).then(channel4 => {
                channel4.overwritePermissions(role, {
                    'VIEW_CHANNEL': true
                }).then(channel5 => {
                    if(input[9] == undefined){
                        channel5.send(c.bot.users.get(newTeam.captain).toString() + ", here is the chat room for " + role.toString());
                    }else{
                        channel5.send("This team is now tracked by the team feature with " + c.bot.user.toString());
                    }
                }); 
            });
	    });
	});
	newTeam.text = channel.id;
	updateTeam(newTeam);
}

function onTeamVoice(role, newTeam, channel, input){
	log.info('team.js onTeamVoice(' + role.id + ', ' + newTeam.name + ', ' + channel.id + ', input)');
	channel.setParent(c.tv).then(channel2 => {
	    channel2.overwritePermissions(c.everyone, {
		    'VIEW_CHANNEL': false
	    });
	    channel2.overwritePermissions(role, {
		    'VIEW_CHANNEL': true
	    });
	});
	newTeam.voice = channel.id;
	updateTeam(newTeam);
}

module.exports.setColor = function(message, input){
	log.info('team.js setColor');
    var team = getByName(input[1]);
    if(team == null){
        message.channel.sendMessage("That team does not exist!");
        return;
    }
    if(!isCaptain(message.author.id, team.captain)){
        message.channel.send("Must be the captain!");
        return;
    }
    team.color = input[2];
    c.bot.guilds.get(c.guildId).roles.get(team.role).setColor(input[2]);
    var embed = new c.Discord.RichEmbed()
        .setTitle("Color Changed")
        .setColor(team.color == null ? "#34363B" : team.color)
    ;
    message.channel.send({embed});
    updateTeam(team);
}

module.exports.addMember = function(message, input){
	log.info('team.js addMember');
    var team = getByName(input[1]);
    if(team == null){
        message.channel.sendMessage("That team does not exist!");
        return;
    }
    if(!isCaptain(message.author.id, team.captain)){
        message.channel.send("Must be the captain!");
        return;
    }
    var index = team.members.indexOf(input[3]);
    var index2 = team.subs.indexOf(input[3]);
    if(index2 > -1){
        message.channel.send("Cannot add a member if they are a sub!");
        return;
    }else if(index > -1){
        message.channel.send("Cannot add the same member twice!");
        return;
    }else{
        c.bot.guilds.get(c.guildId).members.get(input[3]).addRole(team.role);
        team.members.push(input[3]);
        var embed = new c.Discord.RichEmbed()
            .setTitle("Member Added")
            .setColor(team.color == null ? "#34363B" : team.color)
            .setDescription("<@" + input[3] + ">");
        ;
        message.channel.send({embed});
    }
    updateTeam(team);
}

module.exports.removeMember = function(message, input){
	log.info('team.js removeMember');
    var team = getByName(input[1]);
    if(team == null){
        message.channel.send("That team does not exist!");
        return;
    }
    if(!isCaptain(message.author.id, team.captain)){
        message.channel.send("Must be the captain!");
        return;
    }
    var index = team.members.indexOf(input[3]);
    if(index > -1){
        c.bot.guilds.get(c.guildId).members.get(input[3]).removeRole(team.role);
        team.members.splice(index, 1);
        var embed = new c.Discord.RichEmbed()
            .setTitle("Member Removed")
            .setColor(team.color == null ? "#34363B" : team.color)
            .setDescription("<@" + input[3] + ">");
        ;
        message.channel.send({embed});
    }else{
        message.channel.send("Cannot remove a member that wasn't there to begin with!");
        return;
    }
    updateTeam(team);
}

module.exports.addSub = function(message, input){
	log.info('team.js addSub');
    var team = getByName(input[1]);
    if(team == null){
        message.channel.send("That team does not exist!");
        return;
    }
    if(!isCaptain(message.author.id, team.captain)){
        message.channel.send("Must be the captain!");
        return;
    }
    var index = team.subs.indexOf(input[3]);
    var index2 = team.members.indexOf(input[3]);
    if(index2 > -1){
        message.channel.send("Cannot add a sub if they are a member!");
        return;
    }else if(index > -1){
        message.channel.send("Cannot add the same sub twice!");
        return;
    }else{
        c.bot.guilds.get(c.guildId).members.get(input[3]).addRole(team.role);
        team.subs.push(input[3]);
        var embed = new c.Discord.RichEmbed()
            .setTitle("Sub Added")
            .setColor(team.color == null ? "#34363B" : team.color)
            .setDescription("<@" + input[3] + ">");
        ;
        message.channel.send({embed});
    }
    updateTeam(team);
}

module.exports.removeSub = function(message, input){
	log.info('team.js removeSub');
    var team = getByName(input[1]);
    if(team == null){
        message.channel.send("That team does not exist!");
        return;
    }
    if(!isCaptain(message.author.id, team.captain)){
        message.channel.send("Must be the captain!");
        return;
    }
    var index = team.subs.indexOf(input[3]);
    if(index > -1){
        c.bot.guilds.get(c.guildId).members.get(input[3]).removeRole(team.role);
        team.subs.splice(index, 1);
        var embed = new c.Discord.RichEmbed()
            .setTitle("Sub Removed")
            .setColor(team.color == null ? "#34363B" : team.color)
            .setDescription("<@" + input[3] + ">");
        ;
        message.channel.send({embed});
    }else{
        message.channel.send("Cannot remove a sub that wasn't there to begin with!");
        return;
    }
    updateTeam(team);
}

module.exports.setCaptain = function(message, input){
	log.info('team.js setCaptain');
    //I sure hope this person knows what they're doing
    var team = getByName(input[1]);
    if(team == null){
        message.channel.send("That team does not exist!");
        return;
    }
    if(!isCaptain(message.author.id, team.captain)){
        message.channel.send("Must be the captain!");
        return;
    }
    var embed = new c.Discord.RichEmbed()
        .setTitle("Captain Changed")
        .setColor(team.color == null ? "#34363B" : team.color)
        .setDescription("<@" + input[3] + ">");
    ;
    message.channel.send({embed});
    team.captain = input[3];
    c.bot.guilds.get(c.guildId).members.get(team.captain).addRole(team.role);
    
    //remove from members
    var index = team.members.indexOf(input[3]);
    if (index > -1) {
        array.splice(index, 1);
    }
    //add current user to members
    team.members.push(message.author.id);
    
    updateTeam(team);
    user.updateUsernameById(input[3]);
    user.updateUsernameById(message.author.id);
}

module.exports.setName = function(message, input){
	log.info('team.js setName');
    var team = getByName(input[1]);
    if(team == null){
        message.channel.send("That team does not exist!");
        return;
    }
    if(!isCaptain(message.author.id, team.captain)){
        message.channel.send("Must be the captain!");
        return;
    }
    
    var oldName = team.name;
    for(var i = 0; i < teams.length; i++){
        if(teams[i].name.toLowerCase() == input[2].toLowerCase()){
            message.channel.send("A team with that name already exists!");
            return;
        }
        var ind = bannedTeamNames.indexOf(input[2]);
        if(ind > -1){
            message.channel.send("Cannot use a banned team name!");
            return;
        }
    }
    
    team.name = input[2];
    c.bot.guilds.get(c.guildId).roles.get(team.role).setName(team.name);
    c.bot.guilds.get(c.guildId).channels.get(team.text).setName(team.name);
    c.bot.guilds.get(c.guildId).channels.get(team.voice).setName(team.name);
    
    var embed = new c.Discord.RichEmbed()
        .setTitle("Name Changed")
        .setColor(team.color == null ? "#34363B" : team.color)
        .setDescription(oldName + " -> " + team.name);
    ;
    message.channel.send({embed});
    updateTeam(team);
}

module.exports.remove = function(message, input){
	log.info('team.js remove');
    var team = getByName(input[1]);
	var teamIndex = indexByName(input[1]);
    if(team == null){
        message.channel.send("That team does not exist!");
        return;
    }
    if(!isCaptain(message.author.id, team.captain)){
        message.channel.send("Must be the captain!");
        return;
    }
	
	teams.splice(teamIndex, 1);		

	try{
		c.bot.guilds.get(c.guildId).roles.get(team.role).delete();
	}catch(e){
		log.error(e);
	}
	try{
		c.bot.guilds.get(c.guildId).channels.get(team.text).delete();
	}catch(e){
		log.error(e);
	}
	try{
		c.bot.guilds.get(c.guildId).channels.get(team.voice).delete();
	}catch(e){
		log.error(e);
	}
	
	save();    
    
    var embed = new c.Discord.RichEmbed()
        .setTitle("Deleted " + team.name)
        .setColor(team.color == null ? "#34363B" : team.color)
    ;
    message.channel.send({embed});
}
