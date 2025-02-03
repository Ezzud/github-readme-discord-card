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
    truncate: (str: string) => string = (input:string) =>
        input.length > 32 ? `${input.substring(0, 32)}...` : input;

    /* Function developed by https://github.com/Zyplos */
    encodeHTML(input: string): string{
        return input
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    };

    /* Function developed by https://github.com/Zyplos */

    processText(input: string): string {
        return this.encodeHTML(this.truncate(input));
    };

    /* Function developed by https://github.com/Zyplos */
    async getImageBufferFromUrl(imageUrl: string)  {
        const response = await fetch(imageUrl);

        if (!response.ok) {
            throw new Error(`unexpected response ${response.statusText}`);
        }

        const arrayBuffer: ArrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    };

    /* Get the framerate of an APNG */
    getApngFrameRate(arrayBuffer: ArrayBuffer) {
        const fr = upng.decode(arrayBuffer);
        return fr.frames[0].delay;
    };

    /* Get the array of frames from an APNG */
    async getApngBufferFromUrl(imageUrl: string){
        const response = await fetch(imageUrl);

        if (!response.ok) {
            this.logger.error(`Unable to fetch avatar decoration: ${response.statusText}`, this.getApngBufferFromUrl.name);
            return {frames: [], frameRate: 0};
        }

        const arrayBuffer: ArrayBuffer = await response.arrayBuffer();
        const frames: Sharp[] = apng.framesFromApng(arrayBuffer as Buffer, false) as Sharp[];
        const frameRate: number = this.getApngFrameRate(arrayBuffer);

        const base64Frames = [];
        for(let i = 0; i < frames.length; i++) {
            const frame = await frames[i].png().toBuffer();
            base64Frames.push(frame.toString("base64"));
        }
        return {frames: base64Frames, frameRate: frameRate};
    };

    /* Function developed by https://github.com/Zyplos */
    async resizedBufferFromImageBuffer(imageBuffer: Buffer) {
        return await sharp(imageBuffer).resize(128, 128).png().toBuffer();
    };

    /* Function developed by https://github.com/Zyplos */
    async getBase64FromUrl(imageUrl: string) {
        const imageBuffer = await this.getImageBufferFromUrl(imageUrl);
        const sharpBuffer = await this.resizedBufferFromImageBuffer(imageBuffer);
        return sharpBuffer.toString("base64");
    };

    /* Parse user information to create a presence card */
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