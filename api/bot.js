require("dotenv").config();
const { Client } = require("discord.js");
const { parsePresence } = require("./image");
const Card = require("../src/Card");
const logger = require('./logger');

class Bot {
	constructor() {
		this.client = new Client({
			intents: [],
		});
		this.defaultCard = new Card({
			displayName: "User Not Found",
			username: "",
			avatarURL: "",
			height: 97,
		});
		this._init();
	}

	async fetchUser(id) {
		let user = await this.client.users.fetch(id).catch(err => {
			if(err)
				logger.error(`Failed to fetch user with ID ${id} : ${err}`);
		})
		return user;
	}

	async getSVGBadges(badges) {
		var text = "";
		for(let i = 0; i < badges.length; i++) {
			let badge = badges[i];
			text += `<image x="${94.66 + (i * 24)}" y="57.11" width="24" height="24" href="https://discord-lookup.me/assets/${badge}.svg" />`
		}
		return text;
	}

	async getUserBadges(user) {
		const flags = user.flags.bitfield;
	
		const list = {
			1: "DiscordEmployee",
			2: "DiscordPartner",
			4: "HypeSquadEvents",
			8: "BugHunterLevel1",
			64: "HypeSquadBravery",
			128: "HypeSquadBrilliance",
			256: "HypeSquadBalance",
			512: "EarlySupporter",
			1024: "TeamUser",
			4096: "System",
			16384: "BugHunterLevel2",
			65536: "VerifiedBot",
			131072: "EarlyVerifiedBotDeveloper",
			262144: "DiscordCertifiedModerator",
			4194304: "ActiveDeveloper"
		};
	
		function decodeFlags(flags, list) {
			const result = [];
			for (const key in list) {
				if (flags & key) {
					result.push(list[key]);
				}
			}
			return result;
		}
	
		const decoded = decodeFlags(flags, list);

		if (user.banner) {
			decoded.push("DiscordNitro");
		}

		if (user.avatar) {
			if (user.avatar.startsWith('a_') && !decoded.includes("DiscordNitro")) {
				decoded.push("DiscordNitro");
			}
		}

		const badges = decoded;
		if (badges.length === 0) {
			badges = [];
		}

		return badges;
	}
	
	async createCard(id) {
		let user = await this.fetchUser(id);
		if(!user) {
			logger.warning(`Failed to fetch user with ID ${id}, Using default card`);
			return this.defaultCard;
		}
			
		let badges = await this.getUserBadges(user);
		let svgs = await this.getSVGBadges(badges);
		let cardContent = await parsePresence(user);
		let card = new Card(cardContent, svgs);
		logger.success(`Created card for user ${user.tag}`);
		return card;
	}
	
	async getCardRender(card) {
		return card.render();
	}

	async _init() {
		this.client.on("ready", () => {
			logger.info(`Discord Bot connected as ${this.client.user.tag}`);
		});
		await this.client.login(process.env.BOT_TOKEN);
		
		this.client.on("error", logger.error);
	}
}


module.exports = Bot;