interface ICard {
    username: string;
    displayName: string;
    /**
     * Avatar URL
     */
    pfpImage: string;
    height: number;
    /**
     * HTML Content as string.
     * TODO: Switch to real HTMLElements
     */
    svgs: string;
    hasDecoration: boolean;
    /**
     * HTML Content as strings.
     * TODO: Switch to real HTMLElements
     */
    decorationFrameArray: string[];
    frameRate: number;
    /**
     * A Color in the hex format. (#bgef00)
     */
    bgColor: string;
    /**
     * A Color in the hex format. (#dedede)
     */
    displayNameColor: string;
    /**
     * A Color in the hex format. (#bgef00)
     */
    tagColor: string;

    /**
     * A list of SVG Elements representing the badges
     * TODO: Switch it to a real HTMLElement list
     */
    badges: string[];
    /**
     * TODO: Switch to a real HTMLElement
     * @return {string} HTML Content as a string.
     */
    render(): string;
}

export class CardOptions{
    username: string = "No Username Specified";
    displayName: string = "No DisplayName Specified";
    displayNameColor: string = "#FFFFFF";
    pfpImage: string = "";
    height: number = 97;
    frameRate: number = 30;
    bgColor: string = "#202225";
    tagColor: string = "#a3a5a8";
    decorationFrameArray: string[] = [];
    svgs: string = "";
    hasDecoration: boolean = false;
    badges: string[] = [];

    constructor(username?: string, displayName?: string,
        displayNameColor?: string, pfpImage?: string,
        height?: number, framerate?: number,
        bgColor?: string, tagColor?: string,
        decorationFrameArray?: string[], svgs?: string,
        hasDecoration?: boolean, badges?: string[]) {
        this.username = username ?? this.username;
        this.displayName = displayName ?? this.displayName;
        this.displayNameColor = displayNameColor ?? this.displayNameColor;
        this.pfpImage = pfpImage ?? this.pfpImage;
        this.height = height ?? this.height;
        this.frameRate = framerate ?? this.frameRate;
        this.bgColor = bgColor ?? this.bgColor;
        this.tagColor = tagColor ?? this.tagColor;
        this.decorationFrameArray = decorationFrameArray ?? this.decorationFrameArray;
        this.svgs = svgs ?? this.svgs;
        this.hasDecoration = hasDecoration ?? this.hasDecoration;
        this.badges = badges ?? this.badges;
    }
}

export default class Card implements ICard {
    username: string;
    displayName: string;
    displayNameColor: string;
    pfpImage: string;
    height: number;
    frameRate: number;
    bgColor: string;
    tagColor: string;
    decorationFrameArray: string[];
    svgs: string;
    hasDecoration: boolean;
    badges: string[];

    // public static UserNotFound: ICard = new Card("", "User Not Found",undefined,"");
    public static UserNotFound: ICard = new Card(new CardOptions("", "User Not Found."));

    constructor(options: CardOptions) {
        this.username = options.username;
        this.displayName = options.displayName;
        this.displayNameColor = options.displayNameColor;
        this.pfpImage = options.pfpImage;
        this.height = options.height;
        this.frameRate = options.frameRate;
        this.bgColor = options.bgColor;
        this.tagColor = options.tagColor;
        this.decorationFrameArray = options.decorationFrameArray;
        this.svgs = options.svgs;
        this.hasDecoration = options.hasDecoration;
        this.badges = options.badges;
    }

    render(): string {
        const displayNameText: string = this.displayName;
        const usernameText: string = `@${this.username}`;
        const maxTextLength: number = 30; // Adjust this value based on your requirements
        const baseFontSize: number = 16;
        const adjustedFontSize: number = (displayNameText.length + usernameText.length) > maxTextLength ? baseFontSize - ((displayNameText.length + usernameText.length) - maxTextLength) * 0.5 : baseFontSize;

        let frames;
        if(this.decorationFrameArray) {
            const frameCount = this.decorationFrameArray.length;
            frames = this.decorationFrameArray.map((frame, index) => `
            ${index === 0 ?
                    `
                <svg width="601" height="601" transform="translate(12 10) scale(0.13)" display='none' href="${frame}">
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
                </svg>
                `
                    :
                    `
                <svg width="601" height="601" transform="translate(12 10) scale(0.13)" display='none' href="${frame}">
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
                </svg>
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
                fill: ${this.bgColor ? this.bgColor.startsWith("#") ? this.bgColor : `#${this.bgColor}` : "#202225"};
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
                fill: ${this.displayNameColor ? this.displayNameColor.startsWith("#") ? this.displayNameColor : `#${this.displayNameColor}` : "#fff"};
                font-family: SegoeUI-Bold, Segoe UI;
                font-weight: 700;
            }

            .cls-4 {
                font-size: ${adjustedFontSize}px;
                fill: ${this.tagColor ? this.tagColor.startsWith("#") ? this.tagColor : `#${this.tagColor}` : "#b3b5b8"};
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
                        ? `<image id="pfp-image" width="481" height="481" transform="translate(20 17) scale(0.13)" href="${this.pfpImage}"/>`
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