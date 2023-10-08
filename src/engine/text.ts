import { Picture, Renderer } from "./graphics";

const CODEPOINT_LINE_FEED = 10;
const CODEPOINT_CARRIAGE_RETURN = 13;
const CODEPOINT_SPACE = 32;
const CODEPOINT_QUESTION_MARK = 63;

class CursorState {
    x: number;
    y: number;
    readonly originalX: number;
    readonly lineHeight: number;
    readonly wrapWidth: number;

    constructor(x: number, y: number, wrapWidth: number, font: BMFont) {
        this.x = x;
        this.y = y;
        this.originalX = x;
        this.lineHeight = font.lineHeight;
        this.wrapWidth = wrapWidth;
    }

    advance(char: BMFontChar) {
        this.x += char.xAdvance;
    }

    newLine() {
        this.x = this.originalX;
        this.y += this.lineHeight;
    }
}

export class BMFontChar {
    x: number = 0;
    y: number = 0;
    w: number = 0;
    h: number = 0;
    xOffset: number = 0;
    yOffset: number = 0;
    xAdvance: number = 0;
    page: number = 0;

    constructor(init?: Partial<BMFontChar>) {
        Object.assign(this, init);
    }
}

export class BMFont {
    readonly pages: Picture[];
    readonly chars: { [id: number]: BMFontChar } = {};
    readonly lineHeight: number;

    // Takes a bmfont2json-generated descriptor
    constructor(descriptor: any) {
        this.lineHeight = descriptor.common.lineHeight;
        this.pages = descriptor.pages.map((path: string) => new Picture(path));

        if (this.pages.length <= 0) {
            throw new Error("No texture pages defined in font descriptor");
        }

        for (const char of descriptor.chars) {
            this.chars[char.id] = new BMFontChar({
                x: char.x,
                y: char.y,
                w: char.width,
                h: char.height,
                xOffset: char.xoffset,
                yOffset: char.yoffset,
                xAdvance: char.xadvance,
                page: char.page,
            });
        }
    }

    private getChar(id: number) {
        return this.chars[id] ?? this.chars[CODEPOINT_QUESTION_MARK] ?? new BMFontChar();
    }

    private readChar(id: number, cursor: CursorState) {
        switch (id) {
            case CODEPOINT_LINE_FEED:
                cursor.newLine();
                return null;
            case CODEPOINT_CARRIAGE_RETURN:
                return null;
        }

        const char = this.getChar(id);

        if (cursor.x + char.xOffset + char.w > cursor.originalX + cursor.wrapWidth) {
            cursor.newLine();
        }

        return char;
    }

    private printChar(char: BMFontChar, cursor: CursorState, renderer: Renderer) {
        const picture = this.pages[char.page];

        renderer.drawSprite(
            picture,
            {
                x: char.x,
                y: char.y,
                w: char.w,
                h: char.h,
            },
            cursor.x + char.xOffset,
            cursor.y + char.yOffset
        );
    }

    measureText(text: string) {
        const cursor = new CursorState(0, 0, Infinity, this);
        const words = text.split(" ");
        const space = this.getChar(CODEPOINT_SPACE);

        for (const word of words) {
            const slices = Array.from(word);

            for (const slice of slices) {
                const id = slice.codePointAt(0) ?? 0;
                const char = this.readChar(id, cursor);

                if (char) {
                    cursor.advance(char);
                }
            }

            cursor.advance(space);
        }

        return cursor.x - space.xAdvance;
    }

    drawText(
        renderer: Renderer,
        text: string,
        x: number,
        y: number,
        wrapWidth: number = Infinity,
        maxLines = Number.MAX_SAFE_INTEGER
    ) {
        const cursor = new CursorState(x, y, wrapWidth, this);
        const words = text.split(" ");
        const space = this.getChar(CODEPOINT_SPACE);
        let lines = 0;

        for (const word of words) {
            const slices = Array.from(word);
            let readahead = cursor.x;

            // Start by checking word length to see if we need to wordwrap
            for (const slice of slices) {
                const id = slice.codePointAt(0) ?? 0;
                const char = this.getChar(id);

                if (readahead + char.xOffset + char.w > x + wrapWidth) {
                    cursor.newLine();
                    lines++;

                    break;
                }

                readahead += char.xAdvance;
            }

            if (lines >= maxLines) {
                break;
            }

            // Actually print the characters
            for (const slice of slices) {
                const id = slice.codePointAt(0) ?? 0;
                const char = this.readChar(id, cursor);

                if (char) {
                    this.printChar(char, cursor, renderer);
                    cursor.advance(char);
                }
            }

            cursor.advance(space);
        }
    }

    drawTextCentered(
        renderer: Renderer,
        text: string,
        x: number,
        y: number,
        wrapWidth: number = Infinity,
        maxLines = Number.MAX_SAFE_INTEGER
    ) {
        const textWidth = this.measureText(text);

        this.drawText(renderer, text, x - textWidth / 2, y, wrapWidth, maxLines);
    }

    drawTextRight(
        renderer: Renderer,
        text: string,
        x: number,
        y: number,
        wrapWidth: number = Infinity,
        maxLines = Number.MAX_SAFE_INTEGER
    ) {
        const textWidth = this.measureText(text);

        this.drawText(renderer, text, x - textWidth, y, wrapWidth, maxLines);
    }
}
