require("dotenv").config();
const { Client } = require("discord.js");
const { fetchCardData } = require("./image");
const Card = require("../class/Card");
const logger = require('./logger');
const fs = require("fs").promises;

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
		if(this.client.users.cache.has(id)) {
			return this.client.users.cache.get(id);
		}
		let user = await this.client.users.fetch(id, { cache:true}).catch(err => {
			if(err)
				logger.error(`Failed to fetch user with ID ${id} : ${err}`);
		})

		setTimeout(() => {
            this.client.users.cache.sweep((_value, key) => key === id);
			logger.log(`User with ID ${id} removed from cache`);
        }, 14_400_000);

		return user;
	}

	/* Get the base64 value of a badge */
	async getBadgeBase64(badge) {
		const filePath = `./src/assets/${badge}.png`;

		try {
			await fs.access(filePath);
			const fileBuffer = await fs.readFile(filePath);
			const base64Value = fileBuffer.toString('base64');
			return base64Value;
		} catch (error) {
			logger.error(`Failed to get badge ${badge} : ${error}`);
			return;
		}
	}

	/* Convert User Badges to static images */
	async getSVGBadges(badges) {
		var text = "";
		for(let i = 0; i < badges.length; i++) {
			const badge = badges[i];
			const png = await this.getBadgeBase64(badge);
			if(png) {
				const pngData = "data:image/png;base64," + png;
				text += `<image x="${94.66 + (i * 24)}" y="57.11" width="24" height="24" xlink:href="${pngData}" />`
			}
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

		/* Check if User has Nitro */
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
	async createCard(id, options) {
		let user = await this.fetchUser(id);
		if(!user) {
			logger.warning(`GET / - Failed to fetch user with ID ${id}, Rendering default card`);
			return this.defaultCard;
		}
		let cardContent = await fetchCardData(user, options.decoration);
		let badges = await this.getUserBadges(user);
		let svgs = options.badges ? await this.getSVGBadges(badges) : [];

		cardContent.bgColor = options.bgcolor || "#202225";
		cardContent.displayNameColor = options.displayNameColor || "#fff";
		cardContent.tagColor = options.tagColor || "#b3b5b8";
		let card = new Card(cardContent, svgs);
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