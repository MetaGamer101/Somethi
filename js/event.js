var log = require('./log.js');
var core = require('./core.js');
var stat = require('./stat.js')
var c = require('../config.js');

var msgmap = [];

//Route message handlers
function initMsgHandles(){
    //Core Functions
    msgh(/^!m .*/, core.repeat);
    msgh(/^![Ll]ockdown ( ?\d+ ?[HhMmSs])+$/, core.lockdown);
    
    //Stat Functions
    msgh(/^(![Uu]pdate)$/, stat.update);
}

module.exports.ready = function(){
    initMsgHandles();
    var roles = c.bot.guilds.get(c.guildId).roles.array();
    roles.forEach(role => {
        if(role.name == "@everyone"){
            c['everyone'] = role.id;
        }
    });
    log.info('ready');
};

module.exports.message = function(message){
    msgmap.forEach(mh => {
        var input = mh.regex.exec(message.content);
        if(input != null) mh.func(message, input);
    });
};

module.exports.guildMemberAdd = function(guildMember){
    core.guildMemberAdd(guildMember);
};

function msgh(regex, func){
    var res = {
        "regex": regex,
        "func": func
    };
    msgmap.push(res);
}
