class Card {
  constructor(cardContent, svgs) {
    this.username = cardContent.username;
    this.displayName = cardContent.displayName;
    this.pfpImage = cardContent.avatarURL;
    this.height = cardContent.height;
    this.decorationURL = cardContent.decorationURL;
    this.svgs = svgs;
    this.decorationFrameArray = cardContent.decorationFrameArray;
    this.frameRate = cardContent.frameRate;
    this.bgColor = cardContent.bgColor;
  }

	

  render() {
	const displayNameText = this.displayName;
    const usernameText = `@${this.username}`;
    const maxTextLength = 30; // Adjust this value based on your requirements
    const baseFontSize = 16;
    const adjustedFontSize = (displayNameText.length + usernameText.length) > maxTextLength ? baseFontSize - ((displayNameText.length + usernameText.length) - maxTextLength) * 0.5 : baseFontSize;
    

    var frames;
    if(this.decorationFrameArray) {
        const frameCount = this.decorationFrameArray.length;
        frames = this.decorationFrameArray.map((frame, index) => `
            ${index === 0 ? 
                `
                <image width="601" height="601" transform="translate(12 10) scale(0.13)" display='none' xlink:href="${frame}">
                    <animate 
                            id='frame_${index}' 
                            attributeName='display'
                            from="none" 
                            to="inline"
                            dur='${this.frameRate}ms'
                            fill='freeze' 
                            begin="0ms;frame_${frameCount - 1}.end"
                            repeatCount="0" 
                            />
                    <animate dur="${this.frameRate}ms" attributeName="display" from="inline" to="none" begin="frame_${index}.end" repeatCount="0" fill="freeze" />
                </image>
                `
            :
                `
                <image width="601" height="601" transform="translate(12 10) scale(0.13)" display='none' xlink:href="${frame}">
                    <animate 
                            id='frame_${index}' 
                            attributeName='display'
                            from="none" 
                            to="inline"
                            dur='${this.frameRate}ms'
                            fill='freeze' 
                            begin="frame_${index - 1}.end"
                            repeatCount="0" 
                            />
                    <animate dur="${this.frameRate}ms" attributeName="display" from="inline" to="none" begin="frame_${index}.end" repeatCount="0" fill="freeze" />
                </image>
                `
            }
        `).join('');
    }
    

    return `
    <svg id="user_${this.username}_${new Date().getTime()}" data-name="user_${this.username}_${new Date().getTime()}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="382" height="${
      this.height
    }" viewBox="0 0 382 ${this.height}">
    <defs>
        <style>
            .cls-1{
                fill: none;
            }

            .cls-2 {
                fill: ${this.bgColor || "#202225"};
            }

            .pfp-decoration {
                position: absolute;
                width: 160px;
                height: 160px;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            .cls-3 {
                font-size: ${adjustedFontSize}px;
                fill: #fff;
                font-family: SegoeUI-Bold, Segoe UI;
                font-weight: 700;
            }

            .cls-4 {
                font-size: ${adjustedFontSize}px;
                fill: #b3b5b8;
                font-family: SegoeUI, Segoe UI;
            }

            .cls-8 {
                font-family: Segoe UI;
                font-size: 10px;
                fill: #fff;
                font-weight: 700;
            }

            .cls-11 {
                fill: #fff;
                font-family: SegoeUI-Bold, Segoe UI;
                font-weight: 700;
            }

            .cls-14 {
                font-size: 14px;
                fill: #b3b5b8;
                font-family: SegoeUI, Segoe UI;
            }

            .cls-5 {
                letter-spacing: -0.03em;
            }

            .cls-6 {
                letter-spacing: 0em;
            }

            .cls-7 {
                clip-path: url(#clip-path);
            }

            .cls-9 {
                fill: #2f3136;
            }

            .cls-10 {
                clip-path: url(#clip-path-2);
            }
        </style>
        <clipPath id="clip-path">
            <circle id="pfp-clip-shape" class="cls-1" cx="51" cy="48" r="31"/>
        </clipPath>
        <clipPath id="clip-path-2">
            <rect id="details-image-clip-shape" class="cls-1" x="34" y="106" width="52" height="52" rx="8" />
        </clipPath>
    </defs>
    <rect id="base-shape" class="cls-2" width="382" height="${this.height}" rx="4"/>
    <text id="display-name-text" class="cls-3" transform="translate(94.66 43.89)">${displayNameText}</text>
    <text id="username-text" class="cls-4" transform="translate(${94.66 + displayNameText.length * adjustedFontSize * 0.6} 43.89)">${usernameText}</text>
    
    <g id="game-text">
        ${this.svgs}
        <text class="cls-4" transform="translate(94.66 67.11)">
        </text>
    </g>
    <g id="pfp-group">
        <g id="pfp-clip-group">
            <g class="cls-7">
                ${
          this.pfpImage
            ? `<image id="pfp-image" width="481" height="481" transform="translate(20 17) scale(0.13)" xlink:href="${this.pfpImage}"/>`
            : `<rect id="pfp-image" width="481" height="481" transform="translate(20 17) scale(0.13)" fill="#7289da" />`
        }
                
            </g>
        </g>
        ${frames ? `${
            frames
            }` : ""}
    </g>
    <g id="details-group" display="none">
        <rect id="base-details-shape" class="cls-9" x="20" y="94" width="342" height="76" rx="4"/>
    </g>
</svg>`;
  }
}

module.exports = Card;
