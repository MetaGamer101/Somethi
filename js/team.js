var localStorage = require('node-localstorage').LocalStorage('./dat');
var log = require('./log.js');

var teams = [];

var teamTemplate = {
    "name": null,
    "captain": null,
    "members": [],
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

module.exports.all = function(){
    return teams;
}

module.exports.newTeam = function(message, input){
    if(input[1] == undefined){
        message.channel.send('you forgot a team name!');
    }else{
        var newTeam = JSON.parse(JSON.stringify(teamTemplate));
        newTeam.captain = message.author.id;
        newTeam.name = input[2];
        
        
        
        users.push(newTeam);
    }
}