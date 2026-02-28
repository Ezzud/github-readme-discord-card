import {Client, User} from "discord.js";
import {promises as fs} from "fs";
import Logger from "./logger";
import Card, {CardOptions} from "../classes/Card";
import ImageHandler from "./image";
import path from "path";

export default class Bot {
    defaultCard: Card;
    client: Client;
    logger: Logger = new Logger();
    badgeBase64Map: Record<string, string> = {};

    constructor() {
        this.client = new Client({
            intents: [],
        });
        this.defaultCard = Card.UserNotFound;
        this._preloadBadges();
        this._init().then(_r => {});
    }

    /**
     * Preload all badge images as base64 strings into badgeBase64Map
     */
    async _preloadBadges() {
        const assetsDir = path.join(process.cwd(), 'src', 'assets');
        try {
            const files = await fs.readdir(assetsDir);
            for (const file of files) {
                if (file.endsWith('.png')) {
                    const badgeName = file.replace(/\.png$/, '');
                    const filePath = path.join(assetsDir, file);
                    try {
                        const fileBuffer = await fs.readFile(filePath);
                        this.badgeBase64Map[badgeName] = fileBuffer.toString('base64');
                    } catch (err) {
                        this.logger.error(`Failed to preload badge ${badgeName}: ${err}`, this._preloadBadges.name);
                    }
                }
            }
            this.logger.info(`Preloaded ${Object.keys(this.badgeBase64Map).length} badges as base64 strings.`);
        } catch (err) {
            this.logger.error(`Failed to read badges directory: ${err}`, this._preloadBadges.name);
        }
    }

    /**
     * Fetch a user from Discord
     * @param id The ID of the user to fetch
     * @returns The fetched user or undefined if the user could not be fetched
     */
    async fetchUser(id: string) {
        if (this.client.users.cache.has(id)) {
            return this.client.users.cache.get(id);
        }

        let user;
        try {
            user = await this.client.users.fetch(id, { cache: true });
        } catch (err) {
            this.logger.error(`Failed to fetch user with ID ${id} : ${err}`, this.fetchUser.name);
            return undefined;
        }
        if (user) {
            // Remove user from discord.js cache after 24 hours
            setTimeout(() => {
                this.client.users.cache.sweep((_value, key) => key === id);
            }, 86_400_000);
        }
        return user;
    }

    /**
     * Fetch the data needed to create a card for a user
     * @param user The user to fetch data for
     * @param convertDecoration Whether to convert the decoration frames to base64 strings or not
     * @return An object containing the data needed to create a card for the user
     */
    async getBadgeBase64(badge:string) {
        if (this.badgeBase64Map[badge]) {
            return this.badgeBase64Map[badge];
        } else {
            this.logger.error(`Badge base64 not found for: ${badge}`, this.getBadgeBase64.name);
            return;
        }
    }

    /**
     * Get the svg elements for the badges of a user
     * @param badges An array of badge names
     * @returns A string containing the svg elements for the badges
     */
    async getSVGBadges(badges: string[]) {
        const badgeBase64Arr = await Promise.all(badges.map(badge => this.getBadgeBase64(badge)));
        let text = "";
        for (let i = 0; i < badges.length; i++) {
            const png = badgeBase64Arr[i];
            if (png) {
                const pngData = "data:image/png;base64," + png;
                text += `<image x="${94.66 + (i * 24)}" y="57.11" width="24" height="24" href="${pngData}" />`;
            }
        }
        return text;
    }

    /**
     * Decode a flags value into an array of strings based on a list of flag values
     * @param flags The flags value to decode
     * @param list The list of flag values to use for decoding
     * @returns An array of strings representing the decoded flags
     */
    decodeFlags(flags: number, list: Record<number, string>) {
        const result: string[] = [];
        for (const key in list) {
            const bit = Number(key);
            if ((flags & bit) === bit) {
                result.push(list[bit]);
            }
        }
        return result;
    }

    /**
     * Get the badges of a user
     * @param user The user to get badges from
     * @returns An array of badge names the user has
     */
    async getUserBadges(user: User) {
        const tmp = user.flags;
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

    /**
     * Create a card for a user
     * @param id The ID of the user
     * @param options Card options
     * @returns The created card
     */
    async createCard(id: string, options: CardOptions) {
        const user = await this.fetchUser(id);
        if(!user) {
            this.logger.warning(`GET / - Failed to fetch user with ID ${id}, Rendering default card`);
            return this.defaultCard;
        }

        const data = await new ImageHandler().fetchCardData(user, options.hasDecoration);
        const cardOptions: CardOptions = new CardOptions({
            username: data.username,
            displayName: data.displayName,
            pfpImage: data.avatarURL,
            height: data.height,
            frameRate: data.frameRate,
            decorationFrameArray: data.decorationFrameArray,
            bgColor: options.bgColor,
            displayNameColor: options.displayNameColor,
            tagColor: options.tagColor,
        });

        const badges: string[] = await this.getUserBadges(user);
        cardOptions.svgs = options.badges ? await this.getSVGBadges(badges) : "";
        cardOptions.badges = badges;
        return new Card(cardOptions);
    }

    /**
     * Render the card to svg string
     * @param card The card to render
     * @returns The rendered svg string
     */
    async getCardRender(card: Card) {
        return card.render();
    }

    /* Initialize the bot */
    async _init() {
        this.client.on("clientReady", (client: Client<true>) => {
            this.logger.info(`Discord Bot connected as ${client.user.tag}`);
        });
        await this.client.login(process.env.BOT_TOKEN);

        this.client.on("error", (err: Error) => {
            const message: string = err.message + "\n" + "Stack Trace: \n\t" + (err.stack ?? "No stack trace found...");
            this.logger.error(message, this._init.name);
        });
    }
}