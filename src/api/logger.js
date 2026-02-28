const moment = require("moment");
const { existsSync, mkdirSync, appendFileSync } = require("fs");
const Colors = {
	RESET: "\x1b[0m",
	CYAN: "\x1b[36m",
	RED: "\x1b[31m",
	GREEN: "\x1b[32m",
	YELLOW: "\x1b[33m",
	PURPLE: "\x1b[35m",
	BLUE: "\x1b[34m",
	WHITE_ON_RED: "\x1b[37m\x1b[41m",
	WHITE_ON_GREEN: "\x1b[42m\x1b[37m" 
}

function getTime() {
	return `\x1b[90m(${moment().format('hh:mm:ss')})\x1b[0m`
}

function displaySplash() {
	let info = require("../../package.json");
	let bar = "━".repeat(64);
	let nameSplash = `${info.name}  v${info.version}  `;
	let nameSpaces = " ".repeat((bar.length - nameSplash.length - 4) / 2);
	if(nameSpaces.length % 2 !== 0) nameSpaces += " ";

	let devSplash = `Author:  ${info.author}  `;
	let devSpaces = " ".repeat((bar.length - devSplash.length - 4) / 2);
	if(devSpaces.length % 2 !== 0) devSpaces += " ";

	console.log(`${Colors.BLUE}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${Colors.RESET}`)
	console.log(`${Colors.BLUE}┃  ${nameSpaces}${Colors.YELLOW}${nameSplash}${Colors.RESET}${nameSpaces}  ${Colors.BLUE}┃${Colors.RESET}`)
	console.log(`${Colors.BLUE}┃  ${devSpaces}${Colors.PURPLE}${devSplash}${Colors.RESET}${devSpaces}  ${Colors.BLUE}┃${Colors.RESET}`)
	console.log(`${Colors.BLUE}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${Colors.RESET}`)
	console.log("");
}

function getLogTime() {
	return `${moment().format('DD/MM/YYYY')} [${moment().format('HH:mm')}]`;
}

function getLogFileName() {
	return `${moment().format('MM-DD-YYYY')}.log`;
}

function log(message) {
	if(!existsSync("./logs")) mkdirSync(`./logs`);
	appendFileSync(`./logs/${getLogFileName()}`, `\n${getLogTime()} - ${message}`, "UTF-8",{'flags': 'a+'});
}

function info(message) {
	console.log(`${getTime()} ${Colors.CYAN}⁞⁞⁞${Colors.RESET} ${message}`);
	log(message);
}

function warning(message) {
	console.log(`${getTime()} ${Colors.YELLOW}⁞⁞⁞${Colors.RESET} ${message}`);
	log(message);
}

function error(message) {
	console.log(`${getTime()} ${Colors.RED}⁞⁞⁞${Colors.RESET} ${message}`);
	log(message);
}

function success(message) {
	console.log(`${getTime()} ${Colors.GREEN}⁞⁞⁞${Colors.RESET} ${message}`);
	log(message);
}

module.exports = { displaySplash, info, warning, error, success };