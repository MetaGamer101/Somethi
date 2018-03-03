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
    localStorage.setItem('teams', JSON.stringify(teams));
}

module.exports.all = function(){
    return teams;
}

function indexByName(name){
    for(var i = 0; i < teams.length; i++){
        if(teams[i].name == name){
            return i;
        }
    }
    return null;
}

function getByName(name){
    for(var i = 0; i < teams.length; i++){
        if(teams[i].name == name){
            return teams[i];
        }
    }
    return null;
}

function updateTeam(team){
    var i = indexByName(team.name);
    teams[i] = team;
    save();
}

function getStats(team){
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
        if(i == -1){
            usr = user.getById(team.captain);
            i++;
            if(usr == undefined || usr == null) continue;
            res.cap = usr;
            if(usr.rank == null) continue;
        }else if(i < team.members.length){
            usr = user.getById(team.members[i]);
            i++;
            if(usr == undefined || usr == null) continue;
            res.members.push(usr);
            if(usr.rank == null) continue;
        }else{
            usr = user.getById(team.subs[j]);
            j++;
            if(usr == undefined || usr == null) continue;
            res.subs.push(usr);
            if(usr.rank == null) continue;
        }
        
        //for max sr
        res.maxsr = Math.max(res.maxsr, usr.rank);
        //for min sr
        res.minsr = res.minsr == -1 ? usr.rank : Math.min(res.minsr, usr.rank);
        //for team sr
        res.teamsr += usr.rank;
        srdiv++;
        
        //for list or ranks
        var ind = res.ranks.indexOf(usr.rankType);
        if(ind <= -1){
            res.ranks.push(usr.rankType);
        }
    }
    
    //get avg
    res.teamsr = Math.round(res.teamsr / srdiv);
    
    //sort ranks
    res.ranks.sort(function(a,b){
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

module.exports.getTeam = function(message, input){
    var team = getByName(input[1]);
    var teamStats = getStats(team);
    
    var rankStr = "";
    for(var i = 0; i < teamStats.ranks.length; i++){
        if(i != 0) rankStr += " / ";
        rankStr += c.bot.emojis.get(stat.rankEmojis[teamStats.ranks[i]]);
    }
    
    var retStr = "";
    retStr += team.name + ": " + rankStr + "\n";
    retStr += "**" + teamStats.teamsr + "** (" + teamStats.maxsr + " - " + teamStats.minsr + ")" + "\n";
    retStr += stat.getSingleUserLine(teamStats.cap) + "\n";
    //Members
    for(var i = 0; i < teamStats.members.length; i++){
        retStr += stat.getSingleUserLine(teamStats.members[i]) + "\n";
    }
    if(teamStats.subs.length > 0)retStr += "**-SUBS-**" + "\n";
    for(var i = 0; i < teamStats.subs.length; i++){
        retStr += stat.getSingleUserLine(teamStats.subs[i]) + "\n";
    }
    //Subs
    message.channel.send(retStr);
}

module.exports.newTeam = function(message, input){
    if(input[1] == undefined){
        message.channel.send('you forgot a team name!');
    }else{
        for(var i = 0; i < teams.length; i++){
//            if(teams[i].captain == message.author.id){
//                message.channel.sendMessage("You currently cannot create a team if you are captian of another");
//                return;
//            }
            if(teams[i].name == input[2]){
                message.channel.send("A team with that name already exists!");
                return;
            }
            var ind = bannedTeamNames.indexOf(input[2]);
            if(ind > -1){
                message.channel.send("Cannot use a banned team name!");
                return;
            }
        }
        var newTeam = JSON.parse(JSON.stringify(teamTemplate));
        newTeam.captain = message.author.id;
        newTeam.name = input[2];
        if(input[4] != undefined) newTeam.color = input[4];
        if(input[5] != undefined){
            var addUsers = input[5].substr(1, input[5].length).split(' ');
            var b = false;
            for(var i = 0; i < addUsers.length; i++){
                var input2 = /<@(\d+)>/.exec(addUsers[i]);
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
    }
}

module.exports.setColor = function(message, input){
    var team = getByName(input[1]);
    if(team == null){
        message.channel.sendMessage("That team does not exist!");
        return;
    }
    if(team.captain != message.author.id){
        message.channel.send("Must be the captain!");
        return;
    }
    team.color = input[2];
    var embed = new c.Discord.RichEmbed()
        .setTitle("Color Changed")
        .setColor(team.color == null ? "#34363B" : team.color)
    ;
    message.channel.send({embed});
    updateTeam(team);
}

module.exports.addMember = function(message, input){
    var team = getByName(input[1]);
    if(team == null){
        message.channel.sendMessage("That team does not exist!");
        return;
    }
    if(team.captain != message.author.id){
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
    var team = getByName(input[1]);
    if(team == null){
        message.channel.send("That team does not exist!");
        return;
    }
    if(team.captain != message.author.id){
        message.channel.send("Must be the captain!");
        return;
    }
    var index = team.members.indexOf(input[3]);
    if(index > -1){
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
    var team = getByName(input[1]);
    if(team == null){
        message.channel.send("That team does not exist!");
        return;
    }
    if(team.captain != message.author.id){
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
    var team = getByName(input[1]);
    if(team == null){
        message.channel.send("That team does not exist!");
        return;
    }
    if(team.captain != message.author.id){
        message.channel.send("Must be the captain!");
        return;
    }
    var index = team.subs.indexOf(input[3]);
    if(index > -1){
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
    //I sure hope this person knows what they're doing
    var team = getByName(input[1]);
    if(team == null){
        message.channel.send("That team does not exist!");
        return;
    }
    if(team.captain != message.author.id){
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
    updateTeam(team);
}
