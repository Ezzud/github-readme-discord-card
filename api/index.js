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
	server = app.listen(PORT, () => logger.info(`Express server started on port ${PORT}`));
	initExpressRoutes();
}

/* Initialize the express routes */
async function initExpressRoutes() {
	/* Route to generate a card, if no userid, displays a title */
	app.get('/', async(req, res) => {
		const { userid } = req.query;

		if(!userid) {
			res.status(200).send(`
				<!DOCTYPE html>
					<h1>📈 Github Readme Discord Card</h1>
						<p>Syntax: <strong style="background-color: #404040; color:white; padding: 4px;">https://discord-readme-card.ezzud.fr?userid=your_discord_id</strong></p>
				</html>`);
			logger.error(`GET / - Failed to generate card : Missing userid`);
			return;
		}

		logger.info(`GET / - Requested card for user ${userid}`);
		let card = await discordBot.createCard(userid);
		let render = await discordBot.getCardRender(card);
		logger.success(`GET / - Rendered card for user ${userid}`);
		res.setHeader('Content-Type', 'image/svg+xml');
		res.status(200).send(render);
	});
}

/* Display the splash screen & start the backend */
logger.displaySplash();
startExpress();




