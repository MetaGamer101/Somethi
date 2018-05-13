var log = require('./log.js');
var c = require('../config.js');
var heroes = [
    {
        "name": "Genji",
        "emoji": "445067373557579776",
        "regex": /g[ea]nji|g[ea]ngoo/
    },{
        "name": "McCree",
        "emoji": "445067373289144332",
        "regex": /mccree|magoo/
    },{
        "name": "Pharah",
        "emoji": "445067373465305088",
        "regex": /pharah|bird/
    },{
        "name": "Reaper",
        "emoji": "445067373100269580",
        "regex": /reaper|emo|rng/
    },{
        "name": "Soldier: 76",
        "emoji": "445067373251395604",
        "regex": /soldier(: )?(76)?/
    },{
        "name": "Tracer",
        "emoji": "445067373121110018",
        "regex": /tracer|trace?y/
    },{
        "name": "Bastion",
        "emoji": "445067372240437269",
        "regex": /bastion|beep/
    },{
        "name": "Hanzo",
        "emoji": "445067373511180288",
        "regex": /hanzo|handsoap/
    },{
        "name": "Junkrat",
        "emoji": "445067373066584105",
        "regex": /junkrat|junk|rat|trashmouse/
    },{
        "name": "Mei",
        "emoji": "445067373578289153",
        "regex": /mei|satan/
    },{
        "name": "Torbjörn",
        "emoji": "445067373213515783",
        "regex": /torbj(o|ö)rn|tobler(o|ö)ne/
    },{
        "name": "Widowmaker",
        "emoji": "445067373318504460",
        "regex": /widow(maker)?|wondowmaker|wimblebimble/
    },{
        "name": "D.Va",
        "emoji": "445067373570162695",
        "regex": /d.?va|deev/
    },{
        "name": "Reinhardt",
        "emoji": "445067373456916500",
        "regex": /rein(hardt)?/
    },{
        "name": "Roadhog",
        "emoji": "445067373481951242",
        "regex": /roadhog|road|hog|streetpig|highwayswine/
    },{
        "name": "Winston",
        "emoji": "445067373452460034",
        "regex": /winston|mrtickle|scientist/
    },{
        "name": "Zarya",
        "emoji": "445067373574225921",
        "regex": /zarya/
    },{
        "name": "Lúcio",
        "emoji": "445067373230161921",
        "regex": /l(u|ú)cio|frog/
    },{
        "name": "Mercy",
        "emoji": "445067373356253205",
        "regex": /mercy/
    },{
        "name": "Symmetra",
        "emoji": "445067373402128384",
        "regex": /symm?(etra)?/
    },{
        "name": "Zenyatta",
        "emoji": "445067372928172045",
        "regex": /zenyatta|zenny/
    },{
        "name": "Ana",
        "emoji": "445067373527957504",
        "regex": /ana/
    },{
        "name": "Sombra",
        "emoji": "445067373423230976",
        "regex": /sombra|sombrero|simba|cilantro/
    },{
        "name": "Orisa",
        "emoji": "445067373570162696",
        "regex": /orisa|moo|cow|horse|neigh/
    },{
        "name": "Doomfist",
        "emoji": "445067373406584832",
        "regex": /doomfist|doom|fist|onepunchman/
    },{
        "name": "Moira",
        "emoji": "445067373712637972",
        "regex": /moira/
    },{
        "name": "Brigitte",
        "emoji": "445067373423230976",
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
