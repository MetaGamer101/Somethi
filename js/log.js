var moment = require('moment');

module.exports.info = function(message){
    console.log(getName() + getTypeBefore() + 'INFO' + getTypeAfter() + getDate() + ' ' + message);
}
module.exports.warn = function(message){
    console.log(getName() + getTypeBefore() + 'WARN' + getTypeAfter() + getDate() + ' ' + message);
}
module.exports.error = function(message){
    console.log(getName() + getTypeBefore() + 'ERRR' + getTypeAfter() + getDate() + ' ' + message);
}

function getName(){
    return '[\x1b[33mBarista\x1b[0m]';
}

function getTypeBefore(){
    return '[\x1b[32m';
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