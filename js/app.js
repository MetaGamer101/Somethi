//node modules
var discord = require('discord.js');
var localStorage = require('node-localstorage').LocalStorage('./dat');

//modules
var event = require('./event.js');
var c = require('../config.js');

//bot
var bot = new discord.Client();
c['bot'] = bot;

process.on('unhandledRejection', err => console.error('Uncaught Promise Error: \n' + err.stack));
bot.on('ready', event.ready);
bot.on('message', event.message);
bot.on('guildMemberAdd', event.guildMemberAdd);
bot.login(c.token);

