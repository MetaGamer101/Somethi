var log = require('./log.js');
var core = require('./core.js');
var stat = require('./stat.js')
var user = require('./user.js');
var c = require('../config.js');

var msgmap = []; //list of message handle objects
var minmap = []; //list of minute tick objects

var tick = 0;

//Route message handlers
//Note: ONLY ONE function can be run per message. First gets priority.
function initMsgHandles(){
    msgh(/^![Ll]ockdown ( ?\d+ ?[HhMmSs])+$/, core.lockdown);
    msgh(/^(![Ss]tats h[ae]lp)$/, stat.help);
    msgh(/^![Ss]tats add ((\w+)#(\d+))$/, stat.add);
    msgh(/^(![Ss]tats heroes)$/, stat.listHeros);
    msgh(/^![Ss]tats get ((\w+)#(\d+))(.*)$/, stat.get);
    msgh(/^![Ss]tats (.+)$/, stat.addHero);
    msgh(/^!m.*/, core.repeat);
    msgh(/^!l.*/, stat.loadOld);
}
function initMinuteHandles(){
    minh(10, stat.refresh);
    minh(60, stat.update)
}

module.exports.ready = function(){
    log.info('INFO');
    var roles = c.bot.guilds.get(c.guildId).roles.array();
    roles.forEach(role => {
        if(role.name == "@everyone"){
            c['everyone'] = role.id;
        }
    });
    initMsgHandles();
    user.start();
    tickLoop(); //start the tick loop
    log.info('ready');
    stat.update();
    stat.refresh();
};

module.exports.message = function(message){
    for(var i = 0; i < msgmap.length; i++){
        var mh = msgmap[i];
        var input = mh.regex.exec(message.content);
        if(input != null){
            try{
                mh.func(message, input);
                return;
            }catch(e){
                log.error('MH FUNC ERROR: ' + mh.regex);
                log.error(e);
            }
        }
    }
};

module.exports.guildMemberAdd = function(guildMember){
    core.guildMemberAdd(guildMember);
    user.newUser(guildMember);
};

module.exports.guildMemberRemove = function(guildMember){
    core.guildMemberReomve(guildMember);
};








function tickLoop(){
    setTimeout(() => {
        tick++;
        tickLoop();
        runTick();
    },60000);
}

function runTick(){
    minmap.forEach(mh => {
        if(tick % mh.tick == 0) mh.func();
    });
}

function msgh(regex, func){
    var res = {
        "regex": regex,
        "func": func
    };
    msgmap.push(res);
}
function minh(tick, func){
    var res = {
        "tick": tick,
        "func": func
    };
    minmap.push(res);
}
