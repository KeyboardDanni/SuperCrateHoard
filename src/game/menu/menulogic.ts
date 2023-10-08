import { Picture, Renderer } from "../../engine/graphics";
import { Gameloop } from "../../engine/gameloop";
import { BMFont } from "../../engine/text";
import { centered, clamp } from "../../engine/util";
import { DrawLogic, Scene, TickLogic } from "../../engine/scene";
import { GameSingleton } from "../singleton";
import { Focusable, FocusableScene } from "../global/focus";
import { makePlayScene } from "../play/playscene";
import { Board, BoardTileType } from "../board/board";
import { BoardToken, BoardTokenType, TokenToSpawn } from "../board/token";
import { Level } from "../global/level";
import { PictureSlicePair } from "../global/theme";
import { AUTHOR_STRING, GAME_VERSION } from "../version";

import * as titleAtlasJson from "../../res/TitleAtlas.json";
import * as gameAtlas16Json from "../../res/GameAtlas16.json";
import * as gameAtlas24Json from "../../res/GameAtlas24.json";
import * as gameAtlas32Json from "../../res/GameAtlas32.json";
import * as fontDescriptor from "../../res/Pixel12x10.json";
import * as outlineFontDescriptor from "../../res/Pixel12x10_Outline.json";

const titleSlices = titleAtlasJson;
const game16Slices = gameAtlas16Json;
const game24Slices = gameAtlas24Json;
const game32Slices = gameAtlas32Json;

const TEXT_LEFT_ALIGN_UPPER = 80;
const TEXT_LEFT_ALIGN = 64;

const LEVELSET_NAME_X = TEXT_LEFT_ALIGN_UPPER + 264;
const LEVELSET_NAME_WIDTH = 550;

const PREVIEW_RECT_X = 452;
const PREVIEW_RECT_W = 492;
const PREVIEW_RECT_Y = 308;
const PREVIEW_RECT_H = 332;
const PREVIEW_CENTER_X = PREVIEW_RECT_X + PREVIEW_RECT_W / 2;
const PREVIEW_CENTER_Y = PREVIEW_RECT_Y + PREVIEW_RECT_H / 2;

const LEVEL_LIST_Y = PREVIEW_RECT_Y + 12;
const LEVEL_LIST_SPACING = 24;
const LEVEL_LIST_SELECTION_OFFSET = 6;
const LEVEL_LIST_COUNT = 10;
const LEVEL_LIST_SCROLL_OFFSET = 4;
const LEVEL_LIST_STAR_SPACING = 28;
const LEVEL_LIST_TEXT_WIDTH = PREVIEW_RECT_X - TEXT_LEFT_ALIGN - 80;

const SIZE_200_MAX_WIDTH = 12;
const SIZE_200_MAX_HEIGHT = 8;
const SIZE_150_MAX_WIDTH = 18;
const SIZE_150_MAX_HEIGHT = 12;

const FOCUS_PRIORITY_MAIN_MENU = 0;

export class MenuLogic extends Focusable implements TickLogic, DrawLogic {
    private zoomLevels: PictureSlicePair[] = [
        {
            picture: new Picture("res/GameAtlas16.png"),
            slices: game16Slices,
        },
        {
            picture: new Picture("res/GameAtlas24.png"),
            slices: game24Slices,
        },
        {
            picture: new Picture("res/GameAtlas32.png"),
            slices: game32Slices,
        },
    ];
    private picture = new Picture("res/TitleAtlas.png");
    private ticks = 0;
    private previewBoard: Board | null = null;
    private font: BMFont;
    private outlineFont: BMFont;
    private lastCollection = -1;
    private lastLevel = -1;

    constructor(scene: FocusableScene) {
        super(scene);

        this.font = new BMFont(fontDescriptor);
        this.outlineFont = new BMFont(outlineFontDescriptor);
    }

    focusTick(gameloop: Gameloop<GameSingleton>, scene: Scene): void {
        const input = gameloop.input();
        const singleton = gameloop.singleton;

        const action = input.autoRepeatNewest(["left", "right", "up", "down"]);

        switch (action) {
            case "left":
                singleton.currentCollection--;
                singleton.currentLevel = 0;
                break;
            case "right":
                singleton.currentCollection++;
                singleton.currentLevel = 0;
                break;
            case "up":
                singleton.currentLevel--;
                break;
            case "down":
                singleton.currentLevel++;
                break;
        }

        if (input.justPressed("accept") && this.previewBoard) {
            gameloop.setScene(() => {
                return makePlayScene(gameloop);
            });
        }
        if (input.justPressed("menu")) {
            scene.pushEvent("openMenu");
        }
    }

    private makePreviewTokens(board: Board, tokensToSpawn: TokenToSpawn[]) {
        for (const toSpawn of tokensToSpawn) {
            const token = new BoardToken(toSpawn.x, toSpawn.y, board);
            const tile = board.tile(toSpawn.x, toSpawn.y);

            token.picture = board.picture;

            switch (toSpawn.tokenType) {
                case BoardTokenType.Player:
                    token.slice = board.slices.playerHead;
                    break;
                case BoardTokenType.Crate:
                    token.slice = board.slices.crate[tile === BoardTileType.Dropzone ? 1 : 0];
                    break;
            }

            board.addToken(token);
        }
    }

    private updatePreview(singleton: GameSingleton) {
        if (
            singleton.currentCollection === this.lastCollection &&
            singleton.currentLevel === this.lastLevel
        ) {
            return;
        }

        const level = singleton.getCurrentLevel();

        if (!level) return;

        const size = level.measureDimensions();
        let zoomLevel: PictureSlicePair;

        if (size.x <= SIZE_200_MAX_WIDTH && size.y <= SIZE_200_MAX_HEIGHT) {
            zoomLevel = this.zoomLevels[2];
        } else if (size.x <= SIZE_150_MAX_WIDTH && size.y <= SIZE_150_MAX_HEIGHT) {
            zoomLevel = this.zoomLevels[1];
        } else {
            zoomLevel = this.zoomLevels[0];
        }

        this.previewBoard = Board.fromLevel(
            level,
            zoomLevel.picture,
            zoomLevel.slices,
            (board, tokensToSpawn) => {
                this.makePreviewTokens(board, tokensToSpawn);
            }
        );

        this.lastCollection = singleton.currentCollection;
        this.lastLevel = singleton.currentLevel;
    }

    tick(gameloop: Gameloop<GameSingleton>, _scene: Scene) {
        const singleton = gameloop.singleton;

        singleton.currentCollection =
            (singleton.currentCollection + singleton.levels.length) % singleton.levels.length;

        const collection = singleton.levels[singleton.currentCollection];

        if (collection) {
            singleton.currentLevel =
                (singleton.currentLevel + collection.levels.length) % collection.levels.length;
        } else {
            singleton.currentLevel = 0;
        }

        this.updatePreview(singleton);

        this.ticks++;

        this.keepActive(FOCUS_PRIORITY_MAIN_MENU);
    }

    private drawCollectionSelector(renderer: Renderer, singleton: GameSingleton) {
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

        const textWidth = this.font.measureText(name);
        const scale = clamp(LEVELSET_NAME_WIDTH / 2 / textWidth, 0.5, 1.0);

        context.save();
        context.scale(2, 2);

        this.font.drawText(renderer, `Levelset`, TEXT_LEFT_ALIGN_UPPER / 2, 96);

        context.scale(scale, 1);

        this.font.drawText(renderer, name, LEVELSET_NAME_X / 2 / scale, 96);

        context.restore();

        const bob = Math.sin(this.ticks * 0.1) * 3;

        renderer.drawSprite(this.picture, titleSlices.arrowLeft, LEVELSET_NAME_X - 56 - bob, 194);
        renderer.drawSprite(this.picture, titleSlices.arrowRight, LEVELSET_NAME_X - 32 + bob, 194);

        if (collection) {
            this.font.drawText(
                renderer,
                `by ${author}`,
                TEXT_LEFT_ALIGN_UPPER,
                234,
                width - TEXT_LEFT_ALIGN_UPPER * 2,
                1
            );
            this.font.drawText(
                renderer,
                collection.description,
                TEXT_LEFT_ALIGN_UPPER,
                262,
                width - TEXT_LEFT_ALIGN_UPPER * 2,
                2
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
            TEXT_LEFT_ALIGN + 52,
            LEVEL_LIST_Y - bob - 2
        );
        renderer.drawSprite(
            this.picture,
            titleSlices.arrowDown,
            TEXT_LEFT_ALIGN + 52,
            LEVEL_LIST_Y + LEVEL_LIST_SPACING * (LEVEL_LIST_COUNT + 1) + bob + 2
        );

        let cursor = LEVEL_LIST_Y + LEVEL_LIST_SPACING;
        const offset = clamp(
            singleton.currentLevel - LEVEL_LIST_SCROLL_OFFSET,
            0,
            collection.levels.length - LEVEL_LIST_COUNT
        );

        const finishedLevels = singleton.getFinishedLevels();

        for (let i = offset; i < offset + LEVEL_LIST_COUNT; ++i) {
            this.drawLevelItem(
                renderer,
                i,
                cursor,
                i === singleton.currentLevel,
                collection.levels[i],
                finishedLevels[i] > 0
            );

            cursor += LEVEL_LIST_SPACING;
        }
    }

    private drawLevelItem(
        renderer: Renderer,
        index: number,
        cursor: number,
        isSelected: boolean,
        level: Level,
        finished: boolean
    ) {
        if (!level) {
            return;
        }

        let label = `Level ${index + 1}`;

        if (level.name && level.name.length > 0) {
            label += `: ${level.name}`;
        }

        const textWidth = this.font.measureText(label);
        const scale = clamp(LEVEL_LIST_TEXT_WIDTH / textWidth, 0.5, 1.0);
        let font = this.font;
        let star = titleSlices.starWhite;

        if (isSelected) {
            renderer.drawRect(
                TEXT_LEFT_ALIGN - LEVEL_LIST_SELECTION_OFFSET,
                cursor - LEVEL_LIST_SELECTION_OFFSET,
                LEVEL_LIST_TEXT_WIDTH + LEVEL_LIST_SELECTION_OFFSET * 2 + LEVEL_LIST_STAR_SPACING,
                LEVEL_LIST_SPACING,
                "rgb(255, 255, 255, 1.0"
            );
            font = this.outlineFont;
            star = titleSlices.starBlack;
        }

        renderer.drawSprite(this.picture, star[finished ? 1 : 0], TEXT_LEFT_ALIGN, cursor);

        renderer.context().save();
        renderer.context().scale(scale, 1.0);
        font.drawText(
            renderer,
            label,
            (TEXT_LEFT_ALIGN + LEVEL_LIST_STAR_SPACING) / scale,
            cursor,
            LEVEL_LIST_TEXT_WIDTH * 2,
            1
        );
        renderer.context().restore();
    }

    private drawPreviewBoard(renderer: Renderer, lerpTime: number) {
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
            PREVIEW_RECT_W - 1,
            PREVIEW_RECT_H - 1,
            "rgb(0, 0, 0, 0.15)"
        );

        this.previewBoard.x =
            PREVIEW_CENTER_X - (this.previewBoard.width * this.previewBoard.tileWidth) / 2;
        this.previewBoard.y =
            PREVIEW_CENTER_Y - (this.previewBoard.height * this.previewBoard.tileHeight) / 2;

        this.previewBoard.draw(renderer, lerpTime);
    }

    drawTicker(renderer: Renderer) {
        let ticker, offset;

        if (this.ticks % 480 < 240) {
            ticker = "Press Enter to play";
            offset = TEXT_LEFT_ALIGN + 40;
        } else {
            ticker = "Press Backspace to open menu";
            offset = TEXT_LEFT_ALIGN;
        }

        this.font.drawText(renderer, ticker, offset, renderer.canvas().height - 24);
    }

    drawTitle(renderer: Renderer) {
        const width = renderer.canvas().width;

        renderer.drawSprite(
            this.picture,
            titleSlices.title,
            centered(titleSlices.title.w, width),
            24
        );

        const versionString = `Version ${GAME_VERSION}`;

        this.font.drawTextRight(renderer, AUTHOR_STRING, width - 16, 16);
        this.font.drawTextRight(renderer, versionString, width - 16, 40);
    }

    draw(gameloop: Gameloop<GameSingleton>, _scene: Scene, lerpTime: number) {
        const renderer = gameloop.renderer();
        const singleton = gameloop.singleton;

        this.drawTitle(renderer);
        this.drawPreviewBoard(renderer, lerpTime);
        this.drawCollectionSelector(renderer, singleton);
        this.drawLevelSelector(renderer, singleton);
        this.drawTicker(renderer);
    }
}
