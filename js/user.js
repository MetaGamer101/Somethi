var localStorage = require('node-localstorage').LocalStorage('./dat');
var log = require('./log.js');
var team = require('./team.js');
var c = require('../config.js');

var users = [];

var userTemplate = {
    "guildMemberId": null,
    "battleTagName": null,
    "battleTagNum": null,
    "platform": "pc",
    "region": "us",
    "heroCode": 0,
    "rank": null,
    "rankType": 0
};

module.exports.start = function(){
    log.info('starting up user parse');
//    localStorage.setItem('users', JSON.stringify(users));
//    console.log(Object.keys(localStorage.getItem('users')));
//    uncomment above if you want to reset users.
    users = JSON.parse(localStorage.getItem('users'));
    var keys = Object.keys(userTemplate);
    if(users != null){
        var changed = false;
        for(var i = 0; i < users.length; i++){
            for(var j = 0; j < keys.length; j++){
                if(!(keys[j] in users[i])){
                    users[i][keys[j]] = userTemplate[keys[j]];
                    changed = true;
                }
            }
        }
        if(changed){
            log.info('user object updated! current users modified.');
            save();
        }
    }else{
        users = [];
    }
};

module.exports.isMod = function(id){
	return c.bot.guilds.get(c.guildId).members.get(id).roles.keyArray().includes(c.moderator);
}

module.exports.newUser = function(guildMember){
    return newUserById(guildMember.id);
};

module.exports.newUserById = newUserById;

function newUserById(guildMemberId){
    log.info('creating new user with id' + guildMemberId);
    var newUser = JSON.parse(JSON.stringify(userTemplate)); // Create a new user from template
    newUser.guildMemberId = guildMemberId;                      // Give it the correct guildMember
    users.push(newUser);                                    // Add it to the users array
    save();                                                 // Save the users array
    return newUser;
}

module.exports.each = function(cb){
    for(var i = 0; i < users.length; i++){
        cb(users[i]);
    }
}

module.exports.all = function(){
    return users;
}
    
module.exports.save = save;

function save(){
    localStorage.setItem('users', JSON.stringify(users));
}

module.exports.get = get;

function get(guildMember){
    log.info('fetching guildMember ' + guildMember.id);
    for(var i = 0; i < users.length; i++){
        if(users[i].guildMemberId == guildMember.id){
            return users[i];
        }
    }
    return null;
}

module.exports.getById = getById;

function getById(id){
    log.info('fetching guildMember ' + id);
    for(var i = 0; i < users.length; i++){
        if(users[i].guildMemberId == id){
            return users[i];
        }
    }
    return null;
}

function indexById(guildMemberId){
    log.info('fetching index for ' + guildMemberId);
    for(var i = 0; i < users.length; i++){
        if(users[i].guildMemberId == guildMemberId){
            return i;
        }
    }
    return null;
}

module.exports.updateUser = function(userData){
    log.info('updating ' + userData.guildMemberId);
    var i = indexById(userData.guildMemberId);
    log.info('inserting at ' + i);
    users[i] = userData;
    save();
}

module.exports.updateUsernameById = function(id){
    log.info('changing username to match battletag');
    var user = getById(id);
    if(team.isCaptain(id)){
        try{
            c.bot.guilds.get(c.guildId).members.get(id).setNickname('[★] ' + user.battleTagName).catch(function(){
                log.error('probably because is admin');
            });
        }catch(e){
            log.error('probably because is admin');
            log.error(e);
        }
    }else{
        try{
            c.bot.guilds.get(c.guildId).members.get(id).setNickname(user.battleTagName).catch(function(){
                log.error('probably because is admin');
            });
        }catch(e){
            log.error('probably because is admin');
            log.error(e);
        }
    }
}
    
