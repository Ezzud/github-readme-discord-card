require("dotenv").config();
const sharp = require("sharp");

/* Function developed by https://github.com/Zyplos */
const truncate = (input) =>
	input.length > 32 ? `${input.substring(0, 32)}...` : input;

/* Function developed by https://github.com/Zyplos */
const encodeHTML = (input) => {
	return input
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
};

/* Function developed by https://github.com/Zyplos */
const processText = (input) => {
	return encodeHTML(truncate(input));
};

/* Function developed by https://github.com/Zyplos */
const getImageBufferFromUrl = async (imageUrl) => {
	const response = await fetch(imageUrl);

	if (!response.ok) {
		throw new Error(`unexpected response ${response.statusText}`);
	}

	const arrayBuffer = await response.arrayBuffer();
	return Buffer.from(arrayBuffer);
};


/* Function developed by https://github.com/Zyplos */
const resizedBufferFromImageBuffer = async (imageBuffer) => {
	return await sharp(imageBuffer).resize(128, 128).png().toBuffer();
};

/* Function developed by https://github.com/Zyplos */
const getBase64FromUrl = async (imageUrl) => {
	const imageBuffer = await getImageBufferFromUrl(imageUrl);
	const sharpBuffer = await resizedBufferFromImageBuffer(imageBuffer);
	return sharpBuffer.toString("base64");
};

/* Parse user informations to create a presence card */
async function parsePresence(user) {
	const displayName = processText(user.displayName);
	const username = processText(user.tag);
	const decoration = user.avatarDecorationData ? `https://cdn.discordapp.com/avatar-decoration-presets/${user.avatarDecorationData.asset}.png` : undefined;

	let pfpImage = false;
	try {
		const pfpImageUrl = user.displayAvatarURL({
			format: "png",
			dynamic: true,
			size: 128,
		});

		const pfpImageBase64 = await getBase64FromUrl(pfpImageUrl);
		pfpImage = `data:image/png;base64,${pfpImageBase64}`;
	} catch (error) {
		if (error?.code !== 404 && error?.code !== "ETIMEDOUT") {
			console.error(error);
		}
	}

	let decorationImage = false;
	if(decoration) {
		try {
			const decorationImageBase64 = await getBase64FromUrl(decoration);
			decorationImage = `data:image/apng;base64,${decorationImageBase64}`;
		} catch (error) {
			if (error?.code !== 404 && error?.code !== "ETIMEDOUT") {
				console.error(error);
			}
		}
	}
	

	return {
		username: username,
		displayName: displayName,
		decorationURL: decorationImage,
		avatarURL: pfpImage,
		height: 97,
	};
}

module.exports = {parsePresence};
