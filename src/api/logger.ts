import moment from "moment/moment";
import {appendFileSync, existsSync, mkdirSync} from "fs";
import * as info from "../../package.json";
interface ILogger {
    Colors: {
        RESET: string,
        CYAN: string,
        RED: string,
        GREEN: string,
        YELLOW: string,
        PURPLE: string,
        BLUE: string,
        WHITE_ON_RED: string,
        WHITE_ON_GREEN: string
    },
    log: (msg:string) => void,
    info: (msg:string) => void,
    error: (err:string, caller: string) => void,
    warning: (msg:string) => void,
    success: (msg:string) => void,
    getTime: () => string,
    getLogTime: () => string,
    getLogFileName: () => string,
    displaySplash: () => void,

}

export default class Logger implements ILogger {
    Colors = {
        RESET: "\x1b[0m",
        CYAN: "\x1b[36m",
        RED: "\x1b[31m",
        GREEN: "\x1b[32m",
        YELLOW: "\x1b[33m",
        PURPLE: "\x1b[35m",
        BLUE: "\x1b[34m",
        WHITE_ON_RED: "\x1b[37m\x1b[41m",
        WHITE_ON_GREEN: "\x1b[42m\x1b[37m"
    };
    getTime() {
        return `\x1b[90m(${moment().format('hh:mm:ss')})\x1b[0m`;
    }

    displaySplash() {
        const bar = "━".repeat(64);
        const nameSplash = `${info.name}  v${info.version}  `;
        let nameSpaces = " ".repeat((bar.length - nameSplash.length - 4) / 2);
        if(nameSpaces.length % 2 !== 0) nameSpaces += " ";

        const devSplash = `Author:  ${info.author}  `;
        let devSpaces = " ".repeat((bar.length - devSplash.length - 4) / 2);
        if(devSpaces.length % 2 !== 0) devSpaces += " ";

        console.log(`${this.Colors.BLUE}┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓${this.Colors.RESET}`);
        console.log(`${this.Colors.BLUE}┃  ${nameSpaces}${this.Colors.YELLOW}${nameSplash}${this.Colors.RESET}${nameSpaces}  ${this.Colors.BLUE}┃${this.Colors.RESET}`);
        console.log(`${this.Colors.BLUE}┃  ${devSpaces}${this.Colors.PURPLE}${devSplash}${this.Colors.RESET}${devSpaces}  ${this.Colors.BLUE}┃${this.Colors.RESET}`);
        console.log(`${this.Colors.BLUE}┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛${this.Colors.RESET}`);
        console.log("");
    }

    getLogTime(): string {
        return `${moment().format('DD/MM/YYYY')} [${moment().format('HH:mm')}]`;
    }

    getLogFileName(): string {
        return `${moment().format('MM-DD-YYYY')}.log`;
    }

    log(message: string): void {
        if(!existsSync("./logs")) mkdirSync(`./logs`);
        appendFileSync(`./logs/${this.getLogFileName()}`, `\n${this.getLogTime()} - ${message}`,{flag: 'a+', encoding: 'utf8'});
    }

    info(message: string) {
        console.log(`${this.getTime()} ${this.Colors.CYAN}⁞⁞⁞${this.Colors.RESET} ${message}`);
        this.log(message);
    }

    warning(message: string) {
        console.log(`${this.getTime()} ${this.Colors.YELLOW}⁞⁞⁞${this.Colors.RESET} ${message}`);
        this.log(message);
    }

    error(message: string, caller: string) {
        console.log(`${this.getTime()} ${this.Colors.RED}⁞⁞⁞${this.Colors.RESET} ${message} ${this.Colors.PURPLE}||${this.Colors.RESET} ${caller}`);
        this.log(message);
    }

    success(message: string) {
        console.log(`${this.getTime()} ${this.Colors.GREEN}⁞⁞⁞${this.Colors.RESET} ${message}`);
        this.log(message);
    }

}