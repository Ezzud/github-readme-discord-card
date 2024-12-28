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

	/* Fetch user from Discord API */
	async fetchUser(id) {
		let user = await this.client.users.fetch(id).catch(err => {
			if(err)
				logger.error(`Failed to fetch user with ID ${id} : ${err}`);
		})
		return user;
	}

	/* Convert User Badges to static images */
	async getSVGBadges(badges) {
		const svgToImg = require("svg-to-img");
		var text = "";
		for(let i = 0; i < badges.length; i++) {
			let badge = badges[i];
			const response = await fetch(`https://discord-lookup.me/assets/${badge}.svg`);

			if (!response.ok) {
				return;
			}
			let svgValue = await response.text();
			const png = await svgToImg.from(svgValue).toPng({ encoding: "base64" });
			const pngData = "data:image/png;base64," + png;
			text += `<image x="${94.66 + (i * 24)}" y="57.11" width="24" height="24" xlink:href="${pngData}" />`
		}
		return text;
	}

	/* Get user badges by bitfield */
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

		if (user.banner && !decoded.includes("VerifiedBot")) {
			decoded.push("DiscordNitro");
		}

		if (user.avatar) {
			if (user.avatar.startsWith('a_') && !decoded.includes("DiscordNitro") && !decoded.includes("VerifiedBot")) {
				decoded.push("DiscordNitro");
			}
		}

		var badges = decoded;
		if (badges.length === 0) {
			badges = [];
		}

		return badges;
	}
	
	/* Create the svg card for the user */
	async createCard(id) {
		let user = await this.fetchUser(id);
		if(!user) {
			logger.warning(`GET / - Failed to fetch user with ID ${id}, Rendering default card`);
			return this.defaultCard;
		}
			
		let badges = await this.getUserBadges(user);
		let svgs = await this.getSVGBadges(badges);
		let cardContent = await parsePresence(user);
		let card = new Card(cardContent, svgs);

		logger.success(`GET / - Rendered card for user ${user.tag} (${user.id})`);
		return card;
	}
	
	/* Get the svg render of the card */
	async getCardRender(card) {
		return card.render();
	}

	/* Initialize the bot */
	async _init() {
		this.client.on("ready", () => {
			logger.info(`Discord Bot connected as ${this.client.user.tag}`);
		});
		await this.client.login(process.env.BOT_TOKEN);
		
		this.client.on("error", logger.error);
	}
}


module.exports = Bot;