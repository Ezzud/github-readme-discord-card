require("dotenv").config();
const Bot = require('./bot');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./logger');

const PORT = process.env.PORT || 4822;
const discordBot = new Bot();
var server;
var app;

/* Start the express server */
async function startExpress() {
	app = express();
	app.use(bodyParser.json());
	app.use(express.json());
	app.set('etag', false);
	server = app.listen(PORT, () => logger.info(`Express server started on http://localhost:${PORT}`));
	initExpressRoutes();
}

/* Initialize the express routes */
async function initExpressRoutes() {

	/* Route to generate a card, if no userid, displays a title */
	app.get('/', async(req, res) => {
		const queryData = req.query;
		const 	userid = queryData.userid,
      			bgcolor = queryData.bgcolor || "#202225",
				displayNameColor = queryData.displaynamecolor || "#fff",
				tagColor = queryData.tagcolor || "#b3b5b8",
      			decoration = queryData.decoration !== undefined ? queryData.decoration.toLowerCase() !== "false" : true,
      			badges = queryData.badges !== undefined ? queryData.badges.toLowerCase() !== "false" : true;
		if(!userid) {
			res.status(200).send(`
				<!DOCTYPE html>
					<h1>📈 Github Readme Discord Card</h1>
						<p>Syntax: <strong style="background-color: #404040; color:white; padding: 4px;">https://discord-readme-card.ezzud.fr?userid=your_discord_id</strong></p>
				</html>`);
			logger.error(`GET / - Failed to generate card : Missing userid`);
			return;
		}
		let startTime = new Date().getTime();
		logger.info(`GET / - Requested card for user ${userid}`);
		let card = await discordBot.createCard(userid, { bgcolor:bgcolor, decoration:decoration, badges:badges, displayNameColor:displayNameColor, tagColor:tagColor });
		let render = await discordBot.getCardRender(card);
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




