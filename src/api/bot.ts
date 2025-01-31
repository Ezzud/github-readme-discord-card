import {Client, User} from "discord.js";
import {promises as fs} from "fs";
import Logger from "./logger";
import Card, {CardOptions} from "../classes/Card";
import ImageHandler from "./image";

export default class Bot {
    defaultCard: Card;
    client: Client;
    logger: Logger = new Logger();

    constructor() {
        this.client = new Client({
            intents: [],
        });
        this.defaultCard = Card.UserNotFound;
        this._init().then(_r => {});
    }

    /* Fetch user from Discord API */
    async fetchUser(id: string) {
        const user = await this.client.users.fetch(id, { cache:true}).catch(err => {
            if(err)
                this.logger.error(`Failed to fetch user with ID ${id} : ${err}`);
        });
        return user;
    }

    /* Get the base64 value of a badge */
    async getBadgeBase64(badge:string) {
        const filePath = `./assets/${badge}.png`;

        try {
            await fs.access(filePath);
            const fileBuffer = await fs.readFile(filePath);
            return fileBuffer.toString('base64');
        } catch (error) {
            this.logger.error(`Failed to get badge ${badge} : ${error}`);
            return;
        }
    }

    /* Convert User Badges to static images */
    async getSVGBadges(badges: string[]) {
        let text = "";
        for(let i = 0; i < badges.length; i++) {
            const badge = badges[i];
            const png = await this.getBadgeBase64(badge);
            if(png) {
                const pngData = "data:image/png;base64," + png;
                text += `<svg x="${94.66 + (i * 24)}" y="57.11" width="24" height="24" href="${pngData}" />`;
            }
        }
        return text;
    }

    decodeFlags(flags: number, list: Record<number, string>) {
        const result: string[] = [];
        for (const key in list) {
            if (flags && key) {
                result.push(list[key]);
            }
        }
        return result;
    }

    /* Get user badges by bitfield */
    async getUserBadges(user: User) {
        const tmp= user.flags;
        let badges: string[] = [];
        if(tmp) {
            const flags: number = tmp.bitfield;
            const list: Record<number, string> = {
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
            badges = this.decodeFlags(flags, list);
        }

        /* Check if User has Nitro */
        if (user.banner && !badges.includes("VerifiedBot")) {
            badges.push("DiscordNitro");
        }
        if (user.avatar) {
            if (user.avatar.startsWith('a_') && !badges.includes("DiscordNitro") && !badges.includes("VerifiedBot")) {
                badges.push("DiscordNitro");
            }
        }
        return badges;
    }

    /* Create the svg card for the user */
    async createCard(id: string, options: CardOptions) {
        const user = await this.fetchUser(id);
        if(!user) {
            this.logger.warning(`GET / - Failed to fetch user with ID ${id}, Rendering default card`);
            return this.defaultCard;
        }


        const data = await new ImageHandler().fetchCardData(user, options.hasDecoration);
        const cardOptions: CardOptions = new CardOptions(
            data.username,
            data.displayName,
            undefined,
            data.avatarURL,
            data.height,
            data.frameRate,
            undefined,
            undefined,
            data.decorationFrameArray
        );
        const badges: string[] = await this.getUserBadges(user);
        cardOptions.svgs = options.badges ? await this.getSVGBadges(badges) : "";
        cardOptions.badges = badges;
        return new Card(cardOptions);
    }

    /* Get the svg render of the card */
    async getCardRender(card: Card) {
        return card.render();
    }

    /* Initialize the bot */
    async _init() {
        this.client.on("ready", (client: Client<true>) => {
            this.logger.info(`Discord Bot connected as ${client.user.tag}`);
        });
        await this.client.login(process.env.BOT_TOKEN);

        this.client.on("error", (err: Error) => {
            const message: string = err.message + "\n" + "Stack Trace: \n\t" + (err.stack ?? "No stack trace found...");
            this.logger.error(message);
        });
    }
}