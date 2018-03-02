var localStorage = require('node-localstorage').LocalStorage('./dat');
var log = require('./log.js');

var users = [];

var userTemplate = {
    "guildMemberId": null,
    "battleTagName": null,
    "battleTagNum": null,
    "platform": "pc",
    "region": "us",
    "heroCode": 0,
    "rank": 0,
    "rankType": 0
};

module.exports.start = function(){
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

module.exports.newUser = function(guildMember){
    return newUserById(guildMember.id);
};

module.exports.newUserById = newUserById;

function newUserById(guildMemberId){
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
    for(var i = 0; i < users.length; i++){
        if(users[i].guildMemberId == guildMember.id){
            return users[i];
        }
    }
    return null;
}

module.exports.getById = getById;

function getById(id){
    for(var i = 0; i < users.length; i++){
        if(users[i].guildMemberId == id){
            return users[i];
        }
    }
    return null;
}

function indexById(guildMemberId){
    for(var i = 0; i < users.length; i++){
        if(users[i].guildMemberId == guildMemberId){
            return i;
        }
    }
    return null;
}

module.exports.updateUser = function(userData){
    var i = indexById(userData.guildMemberId);
    users[i] = userData;
    save();
}
    
