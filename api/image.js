require("dotenv").config();
const { raw } = require("body-parser");
const sharp = require("sharp");
const apng = require("sharp-apng");
const upng = require("upng-js");
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
    const buffer = Buffer.from(arrayBuffer);
	return buffer;
};

const getApngFrameRate = async (arrayBuffer) => {
	const fr = await upng.decode(arrayBuffer);
	return fr.frames[0].delay;
}

const getApngBufferFromUrl = async (imageUrl) => {
	const response = await fetch(imageUrl);

	if (!response.ok) {
		throw new Error(`unexpected response ${response.statusText}`);
	}

	const arrayBuffer = await response.arrayBuffer();
	const frames = await apng.framesFromApng(arrayBuffer);
	const frameRate = await getApngFrameRate(arrayBuffer);
	
	let base64Frames = [];
	for(let i = 0; i < frames.length; i++) {
		const frame = await frames[i].png().toBuffer();
		base64Frames.push(frame.toString("base64"));
	}
	return {frames: base64Frames, frameRate: frameRate};
}

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

/* Get a base64 gif from a URL */
const getBase64GifFromUrl = async (imageUrl) => {
    const imageBuffer = await getImageBufferFromUrl(imageUrl);
    const gifBuffer = await sharp(imageBuffer).gif().toBuffer();
    return gifBuffer.toString("base64");
};

/* Parse user informations to create a presence card */
async function fetchCardData(user, convertDecoration = true) {
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
	let decorationFrames = [];
	let frameData = {frames: [], frameRate: 0};
	if(decoration) {
		try {
			if(convertDecoration) {
				const decorationImageBase64 = await getBase64GifFromUrl(decoration);
				frameData = await getApngBufferFromUrl(decoration);
				const rawFrames = frameData.frames;
				for(let i = 0; i < rawFrames.length; i++) {
					decorationFrames.push(`data:image/png;base64,${rawFrames[i]}`);
				}
				decorationImage = `data:image/gif;base64,${decorationImageBase64}`;
			}
			
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
		decorationFrameArray: decorationFrames,
		frameRate: frameData.frameRate,
		avatarURL: pfpImage,
		height: 97,
	};
}

module.exports = {fetchCardData};
