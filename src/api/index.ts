import Logger from "./logger";

import 'dotenv/config';
import Bot from "./bot";
import * as express from 'express';
import { Express } from "express-serve-static-core";
import {CardOptions} from "../classes/Card";
import * as bodyParser from "body-parser";

const PORT = process.env.PORT || 4822;
const discordBot = new Bot();
const logger = new Logger();
let server;
let app: Express;

/* Start the express server */
async function startExpress() {
    app = express();
    app.use(bodyParser.json());
    app.use(express.json());
    app.set('etag', false);
    server = app.listen(PORT, () => logger.info(`Express server started on http://localhost:${PORT}`));
    initExpressRoutes();
    return server;
}

/* Initialize the express routes */
async function initExpressRoutes() {

    /* Route to generate a card, if no userid, displays a title */
    app.get('/', async(req, res) => {
        const queryData = req.query;
        const userid = queryData.userid as string;
        const bgcolor = queryData.bgcolor as string || "#202225";
        const displayNameColor = queryData.displaynamecolor as string || "#fff";
        const tagColor = queryData.tagcolor as string || "#b3b5b8";
        const decoData = queryData.decoration;
        let decoration:boolean = true;
        if(typeof decoData === "string" ) { decoration = decoData.toLowerCase() !== "false"; }
        const badgesData = queryData.decoration;
        let badges:boolean = true;
        if(typeof badgesData === "string" ) { badges = badgesData.toLowerCase() !== "false"; }
        if(!userid) {
            res.status(200).send(`
				<!DOCTYPE html>
					<h1>📈 Github Readme Discord Card</h1>
						<p>Syntax: <strong style="background-color: #404040; color:white; padding: 4px;">https://discord-readme-card.ezzud.fr?userid=your_discord_id</strong></p>
				</html>`);
            logger.error(`GET / - Failed to generate card : Missing userid`);
            return;
        }
        const startTime = new Date().getTime();
        logger.info(`GET / - Requested card for user ${userid}`);
        const cardOptions = new CardOptions(
            undefined,undefined,
            displayNameColor, undefined,
            undefined,undefined,
            bgcolor,tagColor,
            undefined,undefined,
            decoration,badges ? []:undefined,
        );
        const card = await discordBot.createCard(userid, cardOptions);
        const render = await discordBot.getCardRender(card);
        res.set({
            "Cache-Control": "public, max-age=900, must-revalidate",
            "Surrogate-Control": "no-store"
        });
        res.setHeader('Content-Type', 'image/svg+xml');
        await res.status(200).send(render);
        logger.success(`GET / - Rendered card for user ${card.username} (${userid}) - ${new Date().getTime() - startTime}ms`);
        return;
    });
}

/* Display the splash screen & start the backend */
logger.displaySplash();
startExpress();