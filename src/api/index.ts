import Logger from "./logger";

import 'dotenv/config';
import Bot from "./bot";
import express from 'express';
import { Express } from "express-serve-static-core";
import {CardOptions} from "../classes/Card";
import { parseBool, ensureHash } from "./utils";


const PORT = process.env.PORT || 4822;
const discordBot = new Bot();
const logger = new Logger();
let server;
let app: Express;

/* Start the express server */
async function startExpress() {
    app = express();
    app.use(express.json());
    app.set('etag', false);
    server = app.listen(PORT, () => logger.info(`Express server started on http://localhost:${PORT}`));
    initExpressRoutes();
    return server;
}

const defaultQueryData = {
    userid: "",
    bgcolor: "#202225",
    displaynamecolor: "#fff",
    tagcolor: "#b3b5b8",
    decoration: true,
    badges: true,
};

/* Initialize the express routes */
async function initExpressRoutes() {

    /* Route to generate a card, if no userid, displays a title */
    app.get('/', async(req, res) => {
        // Parse and normalize query parameters
        const queryData = {
            userid: req.query.userid as string || defaultQueryData.userid,
            bgcolor: ensureHash(req.query.bgcolor as string || defaultQueryData.bgcolor),
            displaynamecolor: ensureHash(req.query.displaynamecolor as string || defaultQueryData.displaynamecolor),
            tagcolor: ensureHash(req.query.tagcolor as string || defaultQueryData.tagcolor),
            decoration: parseBool(req.query.decoration, defaultQueryData.decoration),
            badges: parseBool(req.query.badges, defaultQueryData.badges),
        };

        // Early return if userid is missing
        if (!queryData.userid) {
            res.status(200).send(`
                <!DOCTYPE html>
                <h1>📈 Github Readme Discord Card</h1>
                <p>Syntax: <strong style="background-color: #404040; color:white; padding: 4px;">https://discord-readme-card.ezzud.fr?userid=your_discord_id</strong></p>
                <p style="color: #888;">Note: Minimum response time is 2000ms. Do not use a timeout less than this.</p>
                </html>`);
            return;
        }

        // Log request
        const startTime = Date.now();
        logger.info(`GET / - Requested card for user ${queryData.userid}`);

        // Prepare card options
        const cardOptions = new CardOptions({
            displayNameColor: queryData.displaynamecolor,
            bgColor: queryData.bgcolor,
            tagColor: queryData.tagcolor,
            hasDecoration: queryData.decoration,
            badges: queryData.badges ? [] : undefined,
        });

        // Generate card and render
        const card = await discordBot.createCard(queryData.userid, cardOptions);
        const render = await discordBot.getCardRender(card);

        // Set response headers
        res.setHeader("Cache-Control", "public, max-age=900");
        res.set("Content-Type", "image/svg+xml");

        // Send response
        res.status(200).send(render);
        logger.success(`GET / - Rendered card for user ${card.username} (${queryData.userid}) - ${Date.now() - startTime}ms`);
        return;
    });
}

/* Display the splash screen & start the backend */
logger.displaySplash();
startExpress();