import { Picture, Renderer } from "../../engine/graphics";
import { Gameloop } from "../../engine/gameloop";
import { centered } from "../../engine/util";
import { DrawLogic, Scene, TickLogic } from "../../engine/scene";
import * as titleAtlasJson from "../../res/TitleAtlas.json";
import * as previewAtlasJson from "../../res/PreviewAtlas.json";
import { Board, BoardTile } from "../board/board";

const titleSlices = titleAtlasJson;
const previewSlices = previewAtlasJson;

const PREVIEW_RECT_X = 464;
const PREVIEW_RECT_W = 496;
const PREVIEW_RECT_Y = 304;
const PREVIEW_RECT_H = 336;
const PREVIEW_CENTER_X = 712;
const PREVIEW_CENTER_Y = 472;

export class MenuLogic implements TickLogic, DrawLogic {
    private picture = new Picture("res/TitleAtlas.png");
    private previewPicture = new Picture("res/PreviewAtlas.png");
    private ticks = 0;
    private previewBoard: Board | null = null;

    constructor() {
        this.previewBoard = new Board(
            16,
            16,
            this.previewPicture,
            previewSlices
        );

        for (let y = 0; y < 16; ++y) {
            for (let x = 0; x < 16; ++x) {
                if (Math.random() < 0.4) {
                    this.previewBoard.setTile(x, y, BoardTile.Wall);
                } else {
                    this.previewBoard.setTile(x, y, BoardTile.Floor);
                }
            }
        }
    }

    tick(_gameloop: Gameloop, _scene: Scene) {
        this.ticks++;
    }

    private drawPreviewBoard(renderer: Renderer) {
        if (this.previewBoard) {
            const context = renderer.context();

            context.strokeStyle = "rgb(0, 0, 0, 0.15)";
            context.fillStyle = "rgb(0, 0, 0, 0.15)";
            context.fillRect(
                PREVIEW_RECT_X,
                PREVIEW_RECT_Y,
                PREVIEW_RECT_W,
                PREVIEW_RECT_H
            );
            context.strokeRect(
                PREVIEW_RECT_X + 0.5,
                PREVIEW_RECT_Y + 0.5,
                PREVIEW_RECT_W,
                PREVIEW_RECT_H
            );

            this.previewBoard.x =
                PREVIEW_CENTER_X -
                (this.previewBoard.width * this.previewBoard.tileWidth) / 2;
            this.previewBoard.y =
                PREVIEW_CENTER_Y -
                (this.previewBoard.height * this.previewBoard.tileHeight) / 2;

            this.previewBoard.draw(renderer);
        }
    }

    draw(gameloop: Gameloop, _scene: Scene, _lerpTime: number) {
        const renderer = gameloop.renderer();
        const width = renderer.canvas().width;

        renderer.drawSprite(
            this.picture,
            titleSlices.title,
            centered(titleSlices.title.w, width),
            32
        );

        this.drawPreviewBoard(renderer);
    }
}
