var log = require('./log.js');
var c = require('../config.js');
var heroes = [
    {
        "name": "Genji",
        "emoji": "292715541318205440",
        "regex": /g[ea]nji|g[ea]ngoo/
    },{
        "name": "McCree",
        "emoji": "292715541410349056",
        "regex": /mccree|magoo/
    },{
        "name": "Pharah",
        "emoji": "292715541427126275",
        "regex": /pharah|bird/
    },{
        "name": "Reaper",
        "emoji": "292715541267873793",
        "regex": /reaper|emo|rng/
    },{
        "name": "Soldier: 76",
        "emoji": "292715541397766146",
        "regex": /soldier(: )?(76)?/
    },{
        "name": "Tracer",
        "emoji": "292715542064922625",
        "regex": /tracer|trace?y/
    },{
        "name": "Bastion",
        "emoji": "292715540563099648",
        "regex": /bastion|beep/
    },{
        "name": "Hanzo",
        "emoji": "292715541095907329",
        "regex": /hanzo|handsoap/
    },{
        "name": "Junkrat",
        "emoji": "292715541897150464",
        "regex": /junkrat|junk|rat|trashmouse/
    },{
        "name": "Mei",
        "emoji": "292715541183856647",
        "regex": /mei|satan/
    },{
        "name": "Torbjörn",
        "emoji": "292715542261792768",
        "regex": /torbj(o|ö)rn|tobler(o|ö)ne/
    },{
        "name": "Widowmaker",
        "emoji": "292715543755227136",
        "regex": /widow(maker)?|wondowmaker|wimblebimble/
    },{
        "name": "D.Va",
        "emoji": "292715540261109761",
        "regex": /d.?va|deev/
    },{
        "name": "Reinhardt",
        "emoji": "292715541687304192",
        "regex": /rein(hardt)?/
    },{
        "name": "Roadhog",
        "emoji": "292715542018523136",
        "regex": /roadhog|road|hog|streetpig|highwayswine/
    },{
        "name": "Winston",
        "emoji": "292715542257860608",
        "regex": /winston|mrtickle|scientist/
    },{
        "name": "Zarya",
        "emoji": "292715542253535242",
        "regex": /zarya/
    },{
        "name": "Lúcio",
        "emoji": "292715541322399745",
        "regex": /l(u|ú)cio|frog/
    },{
        "name": "Mercy",
        "emoji": "292715541448097793",
        "regex": /mercy/
    },{
        "name": "Symmetra",
        "emoji": "292715541951414273",
        "regex": /symm?(etra)?/
    },{
        "name": "Zenyatta",
        "emoji": "292715542173712384",
        "regex": /zenyatta|zenny/
    },{
        "name": "Ana",
        "emoji": "292715540483407872",
        "regex": /ana/
    },{
        "name": "Sombra",
        "emoji": "292715541884436481",
        "regex": /sombra|sombrero|simba|cilantro/
    },{
        "name": "Orisa",
        "emoji": "292715541855076352",
        "regex": /orisa|moo|cow|horse|neigh/
    },{
        "name": "Doomfist",
        "emoji": "354421751360258049",
        "regex": /doomfist|doom|fist|onepunchman/
    },{
        "name": "Moira",
        "emoji": "376591947978244106",
        "regex": /moira/
    },{
        "name": "Brigitte",
        "emoji": "437349231674654720",
	"regex": /brig(itte)?/
    }
];

module.exports.getHeroes = function(heroCode){
    //first, find max 2 power
    var pow = 0;
    while(true){
        if(Math.pow(2, pow) <= heroCode){
            pow++;
        }else{
            //too big!
            pow--;
            break;
        }
    }
    var res = [];
    for(var i = pow; i >= 0; i--){
        var sub = Math.pow(2, i);
        if(heroCode - sub >= 0){
            heroCode -= sub;
            res.push(heroes[i]);
        }
    }
    return res;
}

module.exports.toggle = function(heroCode, hero){
    for(var i = 0; i < heroes.length; i++){
        var input = heroes[i].regex.exec(hero.toLowerCase());
        if(input != null){
            if(getAllHeroes(heroCode)[i]){
                heroCode -= Math.pow(2, i);
                return {
                    "heroCode": heroCode,
                    "newStatus": false
                };
            }else{
                heroCode += Math.pow(2, i);
                return {
                    "heroCode": heroCode,
                    "newStatus": true
                };
            }
        }
    }
    log.warn("Bad hero change: " + hero);
    return {
        "heroCode": heroCode,
        "newStatus": null
    };
}

function getAllHeroes(heroCode){
    var pow = 0;
    while(true){
        if(Math.pow(2, pow) <= heroCode){
            pow++;
        }else{
            //too big!
            pow--;
            break;
        }
    }
    var res = new Array(heroes.length);
    for(var i = heroes.length - 1; i >= 0; i--){
        var sub = Math.pow(2, i);
        res[i] = false;
        if(heroCode - sub >= 0){
            heroCode -= sub;
            res[i] = true;
        }
    }
    return res;
}
