import { Gameloop } from "../../engine/gameloop";
import { Picture } from "../../engine/graphics";
import { DrawLogic, Scene, TickLogic } from "../../engine/scene";
import { BMFont } from "../../engine/text";
import { centered, lerp } from "../../engine/util";
import { GameSingleton } from "../singleton";
import { Focusable, FocusableScene } from "../global/focus";
import { Tutorial } from "../global/level";
import { Board } from "../board/board";

import * as titleAtlasJson from "../../res/TitleAtlas.json";
import * as fontDescriptor from "../../res/Pixel12x10.json";

const titleSlices = titleAtlasJson;

const FOCUS_PRIORITY_TUTORIAL = 10;
const DIALOGUE_BOX_Y = 48;
const DIALOGUE_BOX_WIDTH = 640;
const DIALOGUE_BOX_HEIGHT = 54;
const DIALOGUE_BOX_PADDING = 16;
const DIALOGUE_BOX_LINES = 3;
const DIALOGUE_MIN_TIME = 5;
const ARROW_OFFSET_X = 2;
const ARROW_OFFSET_Y = -32;
const ARROW_BOB_AMOUNT = 10;

export class TutorialLogic extends Focusable implements TickLogic, DrawLogic {
    private tutorial: Tutorial | null = null;
    private dialogueIndex = -1;
    private timeOnDialogue = 0;
    private board: Board;
    private picture = new Picture("res/TitleAtlas.png");
    private font: BMFont;

    constructor(scene: FocusableScene, singleton: GameSingleton, board: Board) {
        super(scene);

        const level = singleton.getCurrentLevel();

        if (!level) throw new Error("Missing level");

        if (level.tutorial) {
            this.tutorial = level.tutorial;
        }

        this.board = board;
        this.font = new BMFont(fontDescriptor);

        scene.addEventHandler("titleTimedOut", () => this.titleTimedOut());
    }

    titleTimedOut() {
        if (this.dialogueIndex < 0) {
            this.advanceTutorial();
        }
    }

    advanceTutorial() {
        if (!this.tutorial || this.timeOnDialogue < DIALOGUE_MIN_TIME) return;

        this.dialogueIndex++;
        this.timeOnDialogue = 0;

        if (this.dialogueIndex >= this.tutorial.dialogues.length) {
            this.tutorial = null;
        }
    }

    focusTick(gameloop: Gameloop<GameSingleton>, scene: Scene): void {
        if (!this.tutorial) return;

        const input = gameloop.input();

        if (input.justPressed("accept")) {
            this.advanceTutorial();

            scene.pushEvent("hideTitle");
        } else if (input.justPressed("menu")) {
            scene.pushEvent("openMenu");
        }
    }

    tick(_gameloop: Gameloop<GameSingleton>, _scene: Scene): void {
        if (this.tutorial) {
            this.timeOnDialogue++;
            this.keepActive(FOCUS_PRIORITY_TUTORIAL);
        }
    }

    draw(gameloop: Gameloop<GameSingleton>, _scene: Scene, lerpTime: number): void {
        if (!this.tutorial) return;

        const renderer = gameloop.renderer();
        const dialogue = this.tutorial.dialogues[this.dialogueIndex];

        if (!dialogue || !this.board) return;

        const x = centered(DIALOGUE_BOX_WIDTH, renderer.canvas().width);

        renderer.drawRect(
            x - DIALOGUE_BOX_PADDING,
            DIALOGUE_BOX_Y - DIALOGUE_BOX_PADDING,
            DIALOGUE_BOX_WIDTH + DIALOGUE_BOX_PADDING * 2,
            DIALOGUE_BOX_HEIGHT + DIALOGUE_BOX_PADDING * 2,
            "rgb(0, 0, 0, 0.5)"
        );

        this.font.drawText(
            renderer,
            dialogue.text,
            x,
            DIALOGUE_BOX_Y,
            DIALOGUE_BOX_WIDTH,
            DIALOGUE_BOX_LINES
        );
        const timer = lerp(this.timeOnDialogue - 1, this.timeOnDialogue, lerpTime);
        const bob = Math.abs(Math.sin(timer * 0.1)) * ARROW_BOB_AMOUNT;

        if (dialogue.arrows) {
            for (const arrow of dialogue.arrows) {
                const pos = this.board.boardToWorldCoords(arrow.x + 0.5, arrow.y + 0.5);
                renderer.drawSprite(
                    this.picture,
                    titleSlices.hand,
                    pos.x + ARROW_OFFSET_X + bob,
                    pos.y + ARROW_OFFSET_Y - bob
                );
            }
        }
    }
}
