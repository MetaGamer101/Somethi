var moment = require('moment');
var c = require('../config.js');

module.exports.info = function(message){
    console.log(getName() + getTypeBefore('i') + 'INFO' + getTypeAfter() + getDate() + ' ' + message);
}
module.exports.warn = function(message){
    console.log(getName() + getTypeBefore('w') + 'WARN' + getTypeAfter() + getDate() + ' ' + message);
}
module.exports.error = function(message){
    console.log(getName() + getTypeBefore('e') + 'ERRR' + getTypeAfter() + getDate() + ' ' + message);
}
module.exports.botlog = function(message){
    c.bot.guilds.get(c.guildId).channels.get(c.botLog).send(message);
}

function getName(){
    return '[\x1b[33mBarista\x1b[0m]';
}

function getTypeBefore(s){
    return '[\x1b[3' + (s == 'i' ? 2 : (s == 'e' ? 1 : 3)) + 'm';
}

function getTypeAfter(){
    return '\x1b[0m]';
}

function getDate(){
    var month = (moment().month() + 1).toString();
    if(month.length == 1) month = '0' + month;
    
    var date = (moment().date()).toString();
    if(date.length == 1) date = '0' + date;
    
    var hour = (moment().hour()).toString();
    if(hour.length == 1) hour = '0' + hour;
    
    var minute = (moment().minute()).toString();
    if(minute.length == 1) minute = '0' + minute;
    
    var second = (moment().second()).toString();
    if(second.length == 1) second = '0' + second;
    
    var res = '[' + month + '/' + date + '@' + hour + ":" + minute + ":" + second + ']';

    return res;
}