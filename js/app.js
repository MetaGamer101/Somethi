//node modules
var Discord = require('discord.js');
var localStorage = require('node-localstorage').LocalStorage('../dat');

//modules
var event = require('./event.js');
var c = require('../config.js');
var log = require('./log.js');

//bot
var bot = new Discord.Client();
c['bot'] = bot;
c['Discord'] = Discord;

process.on('unhandledRejection', err => console.error('Uncaught Promise Error: \n' + err.stack));
bot.on('ready', event.ready);
bot.on('message', event.message);
bot.on('guildMemberAdd', event.guildMemberAdd);
bot.on('guildMemberRemove', event.guildMemberRemove);
bot.login(c.token);
log.info('Starting BaristaBot...');


