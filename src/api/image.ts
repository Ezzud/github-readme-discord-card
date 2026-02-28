import Logger from "./logger";
import 'dotenv/config';
import sharp from "sharp";
import {Sharp} from "sharp";
import apng from "sharp-apng";
import * as upng from "upng-js";
import {User} from "discord.js";


export default class ImageHandler {
    logger = new Logger();
    /* Function developed by https://github.com/Zyplos */
    /**
     * Truncate a string to a maximum length of 32 characters and add "..." at the end if it was truncated
     * @param input The string to truncate
     * @returns The truncated string with "..." at the end if it was truncated, or the original string if it was not truncated
     */
    truncate: (str: string) => string = (input:string) =>
        input.length > 32 ? `${input.substring(0, 32)}...` : input;

    /* Function developed by https://github.com/Zyplos */
    /**
     * Encode special characters in a string to their corresponding HTML entities
     * @param input The string to encode
     * @returns The encoded string with special characters replaced by HTML entities
     */
    encodeHTML(input: string): string{
        return input
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    };

    /* Function developed by https://github.com/Zyplos */
    /**
     * Process text by truncating it to 32 characters and encoding special HTML characters
     * @param input The string to process
     * @returns The processed string
     */
    processText(input: string): string {
        return this.encodeHTML(this.truncate(input));
    };

    /* Function developed by https://github.com/Zyplos */
    /**
     * Fetch an image from a URL and return it as a buffer
     * @param imageUrl The URL of the image to fetch
     * @returns A buffer containing the image data
     */
    async getImageBufferFromUrl(imageUrl: string)  {
        const response = await fetch(imageUrl);

        if (!response.ok) {
            throw new Error(`unexpected response ${response.statusText}`);
        }

        const arrayBuffer: ArrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    };

    /**
     * Get the frame rate of an APNG from its array buffer
     * @param arrayBuffer The array buffer of the APNG to get the frame rate from
     * @returns The frame rate of the APNG in milliseconds
     */
    getApngFrameRate(arrayBuffer: ArrayBuffer) {
        const fr = upng.decode(arrayBuffer);
        return fr.frames[0].delay;
    };

    /**
     * Fetch a user from Discord and get the frames of their avatar decoration as base64 strings along with the frame rate
     * @param imageUrl The URL of the avatar decoration to fetch
     * @returns An object containing an array of base64 strings for each frame of the avatar decoration and the frame rate in milliseconds
     */
    async getApngBufferFromUrl(imageUrl: string){
        const response = await fetch(imageUrl);

        if (!response.ok) {
            this.logger.error(`Unable to fetch avatar decoration: ${response.statusText}`, this.getApngBufferFromUrl.name);
            return {frames: [], frameRate: 0};
        }

        const arrayBuffer: ArrayBuffer = await response.arrayBuffer();
        const frames: Sharp[] = apng.framesFromApng(Buffer.from(arrayBuffer), false) as Sharp[];
        const frameRate: number = this.getApngFrameRate(arrayBuffer);

        const base64Frames = [];
        for(let i = 0; i < frames.length; i++) {
            const frame = await frames[i].png().toBuffer();
            base64Frames.push(frame.toString("base64"));
        }
        return {frames: base64Frames, frameRate: frameRate};
    };

    /* Function developed by https://github.com/Zyplos */
    /**
     * Resize an image buffer to 128x128 and return it as a buffer
     * @param imageBuffer The image buffer to resize
     * @returns A buffer containing the resized image data
     */
    async resizedBufferFromImageBuffer(imageBuffer: Buffer) {
        return await sharp(imageBuffer).resize(128, 128).png().toBuffer();
    };

    /* Function developed by https://github.com/Zyplos */
    /**
     * Get a base64 string from an image URL
     * @param imageUrl The URL of the image to get the base64 string from
     * @returns A base64 string of the image
     */
    async getBase64FromUrl(imageUrl: string) {
        const imageBuffer = await this.getImageBufferFromUrl(imageUrl);
        const sharpBuffer = await this.resizedBufferFromImageBuffer(imageBuffer);
        return sharpBuffer.toString("base64");
    };

    /* Parse user information to create a presence card */
    /**
     * Fetch the data needed to create a card for a user
     * @param user The user to fetch data for
     * @param convertDecoration Whether to convert the decoration frames to base64 strings or not
     * @return An object containing the data needed to create a card for the user
     */
    async fetchCardData(user: User, convertDecoration = true) {
        const displayName = this.processText(user.displayName);
        const username = this.processText(user.tag);
        const decoration = user.avatarDecorationData ? `https://cdn.discordapp.com/avatar-decoration-presets/${user.avatarDecorationData.asset}.png` : undefined;

        let pfpImage:string|undefined = undefined;
        try {
            const pfpImageUrl = user.displayAvatarURL({
                extension: "png",
                forceStatic : false,
                size: 128,
            });

            const pfpImageBase64 = await this.getBase64FromUrl(pfpImageUrl);
            pfpImage = `data:image/png;base64,${pfpImageBase64}`;
        } catch (error) {
            const err = error as {code:number | string};
            if (err.code !== 404 && err.code !== "ETIMEDOUT") {
                console.error(error);
            }
        }

        const decorationFrames = [];
        let frameData: {frames: string[], frameRate: number} = {frames: [], frameRate: 0};
        if(decoration) {
            try {
                if(convertDecoration) {
                    frameData = await this.getApngBufferFromUrl(decoration);
                    const rawFrames = frameData.frames;
                    for(let i = 0; i < rawFrames.length; i++) {
                        decorationFrames.push(`data:image/png;base64,${rawFrames[i]}`);
                    }
                }

            } catch (error) {
                const err = error as {code:number | string};
                if (err.code !== 404 && err.code !== "ETIMEDOUT") {
                    console.error(error);
                }
            }
        }
        return {
            username: username,
            displayName: displayName,
            decorationFrameArray: decorationFrames,
            displayNameColor: "#fff",
            frameRate: frameData.frameRate,
            avatarURL: pfpImage,
            height: 97,
        };
    }
}