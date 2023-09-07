import { Picture, Renderer } from "../../engine/graphics";
import { Gameloop } from "../../engine/gameloop";
import { BMFont } from "../../engine/text";
import { centered, clamp } from "../../engine/util";
import { DrawLogic, Scene, TickLogic } from "../../engine/scene";
import { GameSingleton } from "../singleton";
import {
    Board,
    BoardTileType,
    BoardToken,
    BoardTokenType,
} from "../board/board";
import { Level } from "../global/level";

import * as titleAtlasJson from "../../res/TitleAtlas.json";
import * as previewAtlasJson from "../../res/PreviewAtlas.json";
import * as fontDescriptor from "../../res/Pixel12x10.json";
import * as outlineFontDescriptor from "../../res/Pixel12x10_Outline.json";

const titleSlices = titleAtlasJson;
const previewSlices = previewAtlasJson;

const PREVIEW_RECT_X = 468;
const PREVIEW_RECT_W = 500;
const PREVIEW_RECT_Y = 308;
const PREVIEW_RECT_H = 332;
const PREVIEW_CENTER_X = 714;
const PREVIEW_CENTER_Y = 474;

const LEVEL_LIST_Y = PREVIEW_RECT_Y + 12;
const LEVEL_LIST_SPACING = 24;
const LEVEL_LIST_SELECTION_OFFSET = 6;
const LEVEL_LIST_COUNT = 10;
const LEVEL_LIST_SCROLL_OFFSET = 4;

export class MenuLogic implements TickLogic, DrawLogic {
    private picture = new Picture("res/TitleAtlas.png");
    private previewPicture = new Picture("res/PreviewAtlas.png");
    private ticks = 0;
    private previewBoard: Board | null = null;
    private font: BMFont;
    private outlineFont: BMFont;
    private lastCollection = -1;
    private lastLevel = -1;

    constructor() {
        this.font = new BMFont(fontDescriptor);
        this.outlineFont = new BMFont(outlineFontDescriptor);
    }

    private makePreviewToken(
        tokenType: BoardTokenType,
        tileType: BoardTileType
    ) {
        const token = new BoardToken();

        switch (tokenType) {
            case BoardTokenType.Player:
                token.picture = this.previewPicture;
                token.slice = previewSlices.player;
                break;
            case BoardTokenType.Crate:
                token.picture = this.previewPicture;
                token.slice =
                    previewSlices.crate[
                        tileType === BoardTileType.Dropzone ? 1 : 0
                    ];
                break;
        }

        return token;
    }

    private updatePreview(singleton: GameSingleton) {
        if (
            singleton.currentCollection === this.lastCollection &&
            singleton.currentLevel === this.lastLevel
        ) {
            return;
        }

        const collection = singleton.levels[singleton.currentCollection];

        if (!collection) return;

        const level = collection.levels[singleton.currentLevel];

        if (!level) return;

        this.previewBoard = Board.fromLevel(
            level,
            this.previewPicture,
            previewSlices,
            this.makePreviewToken.bind(this)
        );

        this.lastCollection = singleton.currentCollection;
        this.lastLevel = singleton.currentLevel;
    }

    tick(gameloop: Gameloop<GameSingleton>, _scene: Scene) {
        const input = gameloop.input();
        const singleton = gameloop.singleton;

        if (input.autoRepeat("left") && !input.held("right")) {
            singleton.currentCollection--;
        } else if (input.autoRepeat("right") && !input.held("left")) {
            singleton.currentCollection++;
        }

        if (input.autoRepeat("up") && !input.held("down")) {
            singleton.currentLevel--;
        } else if (input.autoRepeat("down") && !input.held("up")) {
            singleton.currentLevel++;
        }

        singleton.currentCollection =
            (singleton.currentCollection + singleton.levels.length) %
            singleton.levels.length;

        const collection = singleton.levels[singleton.currentCollection];

        if (collection) {
            singleton.currentLevel =
                (singleton.currentLevel + collection.levels.length) %
                collection.levels.length;
        } else {
            singleton.currentLevel = 0;
        }

        this.updatePreview(singleton);

        this.ticks++;
    }

    private drawCollectionSelector(
        renderer: Renderer,
        singleton: GameSingleton
    ) {
        const width = renderer.canvas().width;
        const context = renderer.context();
        const collection = singleton.levels[singleton.currentCollection];
        let name = "<error>";
        let author = "Anonymous";

        if (collection) {
            name = collection.name;

            if (collection.author.length > 0) {
                author = collection.author;
            }
        }

        context.save();
        context.scale(2, 2);

        this.font.drawText(renderer, `Level Set   ${name}`, 40, 100);

        context.restore();

        const bob = Math.sin(this.ticks * 0.1) * 3;

        renderer.drawSprite(
            this.picture,
            titleSlices.arrowLeft,
            310 - bob,
            202
        );
        renderer.drawSprite(
            this.picture,
            titleSlices.arrowRight,
            334 + bob,
            202
        );

        if (collection) {
            this.font.drawText(renderer, `by ${author}`, 80, 238, width - 140);
            this.font.drawText(
                renderer,
                collection.description,
                80,
                266,
                width - 140
            );
        }
    }

    private drawLevelSelector(renderer: Renderer, singleton: GameSingleton) {
        const collection = singleton.levels[singleton.currentCollection];

        if (!collection) {
            return;
        }

        const bob = Math.sin(this.ticks * 0.1) * 3;

        renderer.drawSprite(
            this.picture,
            titleSlices.arrowUp,
            132,
            LEVEL_LIST_Y - bob - 2
        );
        renderer.drawSprite(
            this.picture,
            titleSlices.arrowDown,
            132,
            LEVEL_LIST_Y + LEVEL_LIST_SPACING * (LEVEL_LIST_COUNT + 1) + bob + 2
        );

        let cursor = LEVEL_LIST_Y + LEVEL_LIST_SPACING;
        const offset = clamp(
            singleton.currentLevel - LEVEL_LIST_SCROLL_OFFSET,
            0,
            collection.levels.length - LEVEL_LIST_COUNT
        );

        for (let i = offset; i < offset + LEVEL_LIST_COUNT; ++i) {
            this.drawLevelItem(
                renderer,
                i,
                cursor,
                i === singleton.currentLevel,
                collection.levels[i]
            );

            cursor += LEVEL_LIST_SPACING;
        }
    }

    private drawLevelItem(
        renderer: Renderer,
        index: number,
        cursor: number,
        isSelected: boolean,
        level: Level
    ) {
        if (!level) {
            return;
        }

        let label = `Level ${index + 1}`;

        if (level.name && level.name.length > 0) {
            label += `: ${level.name}`;
        }

        if (isSelected) {
            renderer.drawRect(
                80 - LEVEL_LIST_SELECTION_OFFSET,
                cursor - LEVEL_LIST_SELECTION_OFFSET,
                PREVIEW_RECT_X - 120,
                LEVEL_LIST_SPACING,
                "rgb(255, 255, 255, 1.0"
            );
            this.outlineFont.drawText(renderer, label, 104, cursor);
        } else {
            this.font.drawText(renderer, label, 104, cursor);
        }
    }

    private drawPreviewBoard(renderer: Renderer) {
        if (!this.previewBoard) {
            return;
        }

        renderer.drawRect(
            PREVIEW_RECT_X,
            PREVIEW_RECT_Y,
            PREVIEW_RECT_W,
            PREVIEW_RECT_H,
            "rgb(0, 0, 0, 0.15)"
        );
        renderer.drawRectOutline(
            PREVIEW_RECT_X + 0.5,
            PREVIEW_RECT_Y + 0.5,
            PREVIEW_RECT_W,
            PREVIEW_RECT_H,
            "rgb(0, 0, 0, 0.15)"
        );

        this.previewBoard.x =
            PREVIEW_CENTER_X -
            (this.previewBoard.width * this.previewBoard.tileWidth) / 2;
        this.previewBoard.y =
            PREVIEW_CENTER_Y -
            (this.previewBoard.height * this.previewBoard.tileHeight) / 2;

        this.previewBoard.draw(renderer);
    }

    drawTicker(renderer: Renderer) {
        let ticker, offset;

        if (this.ticks % 480 < 240) {
            ticker = "Press Enter to play";
            offset = 120;
        } else {
            ticker = "Press Backspace to open menu";
            offset = 80;
        }

        this.font.drawText(
            renderer,
            ticker,
            offset,
            renderer.canvas().height - 24
        );
    }

    draw(gameloop: Gameloop<GameSingleton>, _scene: Scene, _lerpTime: number) {
        const renderer = gameloop.renderer();
        const width = renderer.canvas().width;
        const singleton = gameloop.singleton;

        renderer.drawSprite(
            this.picture,
            titleSlices.title,
            centered(titleSlices.title.w, width),
            24
        );

        this.drawPreviewBoard(renderer);
        this.drawCollectionSelector(renderer, singleton);
        this.drawLevelSelector(renderer, singleton);
        this.drawTicker(renderer);
    }
}
