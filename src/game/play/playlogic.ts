import { Gameloop } from "../../engine/gameloop";
import { Picture } from "../../engine/graphics";
import { DrawLogic, Scene, TickLogic } from "../../engine/scene";
import { BMFont } from "../../engine/text";
import { centered } from "../../engine/util";
import { GameSingleton } from "../singleton";
import { makeMenuScene } from "../menu/menuscene";
import { Focusable, FocusableScene } from "../global/focus";
import { Preferences } from "../global/savedata";
import { Board, BoardTileType } from "../board/board";
import { BoardTokenType, Direction, TokenToSpawn } from "../board/token";
import { Orientation, Player } from "./player";
import { Crate } from "./crate";
import { Confetti } from "./confetti";
import { makePlayScene } from "./playscene";

import * as gameAtlas32Json from "../../res/GameAtlas32.json";
import * as fontDescriptor from "../../res/Pixel12x10_Outline.json";

const game32Slices = gameAtlas32Json;

const TITLE_MAX_WIDTH = 900;
const TITLE_TIMER = 270;
const FOCUS_PRIORITY_PLAY = 0;
const WIN_FRAMES = 300;
const WIN_FRAMES_SKIP = 40;

enum Action {
    WalkLeft,
    WalkRight,
    WalkUp,
    WalkDown,
    PushLeft,
    PushRight,
    PushUp,
    PushDown,
}

export class PlayLogic extends Focusable implements TickLogic, DrawLogic {
    private picture: Picture = new Picture("res/GameAtlas32.png");
    private font;
    private board: Board;
    private inputName: string | null = null;
    private history: Action[] = [];
    private redoHistory: Action[] = [];
    private winTimer = 0;
    private confetti: Confetti | null = null;
    private titleTimer = TITLE_TIMER;

    constructor(gameloop: Gameloop<GameSingleton>, scene: FocusableScene) {
        super(scene);

        this.font = new BMFont(fontDescriptor);

        const singleton = gameloop.singleton;
        const level = singleton.getCurrentLevel();

        if (!level) throw new Error("Missing level");

        this.board = Board.fromLevel(level, this.picture, game32Slices, (board, tokensToSpawn) => {
            this.makeTokens(board, tokensToSpawn);
        });

        const canvas = gameloop.renderer().canvas();

        this.board.x = centered(this.board.width * this.board.tileWidth, canvas.width);
        this.board.y = centered(this.board.height * this.board.tileHeight, canvas.height);

        this.preferencesChanged(singleton.preferences);

        scene.addEventHandler("hideTitle", () => this.hideTitle());
        scene.addEventHandler("preferencesChanged", (preferences) =>
            this.preferencesChanged(preferences as Preferences)
        );
    }

    private preferencesChanged(preferences: Preferences) {
        this.board.getAnalysis().setAnalysisMode(preferences.analysis, preferences.analysisAction);
    }

    private hideTitle() {
        this.titleTimer = 0;
    }

    private makeTokens(board: Board, tokensToSpawn: TokenToSpawn[]) {
        for (const toSpawn of tokensToSpawn) {
            let token;

            switch (toSpawn.tokenType) {
                case BoardTokenType.Player:
                    token = new Player(toSpawn.x, toSpawn.y, board);
                    break;
                case BoardTokenType.Crate:
                    token = new Crate(toSpawn.x, toSpawn.y, board);
                    break;
            }

            board.addToken(token);
        }
    }

    private getPlayer(): Player {
        const tokens = this.board.getTokens();

        return tokens.find((token) => token instanceof Player) as Player;
    }

    private tryWalk(direction: Direction, orientation: Orientation = Orientation.Forward) {
        const player = this.getPlayer();

        if (!player) return false;

        return player.tryWalk(direction, orientation);
    }

    private tryPush(direction: Direction, preventRestricted: boolean) {
        const player = this.getPlayer();

        if (!player) return false;

        return player.tryPush(direction, preventRestricted);
    }

    private tryPull(direction: Direction, preventRestricted: boolean) {
        const player = this.getPlayer();

        if (!player) return false;

        return player.tryPull(direction, preventRestricted);
    }

    private doAction(action: Action, isRedo: boolean): boolean {
        const preventRestricted = !isRedo && this.board.getAnalysis().shouldPreventRestricted();

        switch (action) {
            case Action.WalkLeft:
                return this.tryWalk(Direction.Left);
            case Action.WalkRight:
                return this.tryWalk(Direction.Right);
            case Action.WalkUp:
                return this.tryWalk(Direction.Up);
            case Action.WalkDown:
                return this.tryWalk(Direction.Down);
            case Action.PushLeft:
                return this.tryPush(Direction.Left, preventRestricted);
            case Action.PushRight:
                return this.tryPush(Direction.Right, preventRestricted);
            case Action.PushUp:
                return this.tryPush(Direction.Up, preventRestricted);
            case Action.PushDown:
                return this.tryPush(Direction.Down, preventRestricted);
        }
    }

    private undoAction(action: Action): boolean {
        switch (action) {
            case Action.WalkLeft:
                return this.tryWalk(Direction.Right, Orientation.Backward);
            case Action.WalkRight:
                return this.tryWalk(Direction.Left, Orientation.Backward);
            case Action.WalkUp:
                return this.tryWalk(Direction.Down, Orientation.Backward);
            case Action.WalkDown:
                return this.tryWalk(Direction.Up, Orientation.Backward);
            case Action.PushLeft:
                return this.tryPull(Direction.Right, false);
            case Action.PushRight:
                return this.tryPull(Direction.Left, false);
            case Action.PushUp:
                return this.tryPull(Direction.Down, false);
            case Action.PushDown:
                return this.tryPull(Direction.Up, false);
        }
    }

    private tryAction(action: Action): boolean {
        if (this.doAction(action, false)) {
            this.history.push(action);

            if (
                this.redoHistory.length > 0 &&
                this.redoHistory[this.redoHistory.length - 1] === action
            ) {
                // Try to preserve redo history if the new action is the same as what would have
                //  been redone.
                this.redoHistory.pop();
            } else {
                this.redoHistory = [];
            }

            return true;
        }

        return false;
    }

    private undo(): boolean {
        if (this.history.length <= 0) {
            return false;
        }

        const action = this.history[this.history.length - 1];

        if (this.undoAction(action)) {
            this.history.pop();
            this.redoHistory.push(action);
            return true;
        }

        return false;
    }

    private redo(): boolean {
        if (this.redoHistory.length <= 0) {
            return false;
        }

        const action = this.redoHistory[this.redoHistory.length - 1];

        if (this.doAction(action, true)) {
            this.redoHistory.pop();
            this.history.push(action);
            return true;
        }

        return false;
    }

    private saveWin(gameloop: Gameloop<GameSingleton>) {
        const singleton = gameloop.singleton;

        singleton.markLevelFinished();
        singleton.saveData.toLocalStorage();
    }

    private checkWinCondition(gameloop: Gameloop<GameSingleton>) {
        for (let y = 0; y < this.board.height; ++y) {
            for (let x = 0; x < this.board.width; ++x) {
                const tile = this.board.tile(x, y);

                if (tile !== BoardTileType.Dropzone) {
                    continue;
                }

                const tokens = this.board.tokensForTile(x, y);
                const crate = tokens.find((token) => token instanceof Crate);

                if (!crate) {
                    return;
                }
            }
        }

        if (this.winTimer <= 0) {
            this.winTimer = 1;

            this.saveWin(gameloop);
        }
    }

    private goToNextLevel(gameloop: Gameloop<GameSingleton>) {
        const singleton = gameloop.singleton;

        const collection = singleton.levels[singleton.currentCollection];

        if (!collection) {
            return false;
        }

        if (!collection.levels[singleton.currentLevel + 1]) {
            return false;
        }

        singleton.currentLevel++;

        gameloop.setScene(() => {
            return makePlayScene(gameloop);
        });

        return true;
    }

    private goToMenu(gameloop: Gameloop) {
        gameloop.setScene(() => {
            return makeMenuScene(gameloop.input());
        });
    }

    private gameWonTick(gameloop: Gameloop<GameSingleton>) {
        const input = gameloop.input();
        const player = this.getPlayer();

        if (player) {
            player.winAnimation();
        }

        if (!this.confetti) {
            const canvas = gameloop.renderer().canvas();

            this.confetti = new Confetti(
                canvas.width,
                canvas.height,
                this.board.picture,
                this.board.slices
            );
        }

        this.confetti.tick();

        if (
            this.winTimer >= WIN_FRAMES ||
            (input.justPressed("accept") && this.winTimer >= WIN_FRAMES_SKIP)
        ) {
            this.goToNextLevel(gameloop) || this.goToMenu(gameloop);
        }

        this.winTimer++;
    }

    private gameActiveTick(gameloop: Gameloop<GameSingleton>) {
        if (this.inputName) {
            switch (this.inputName) {
                case "left":
                    this.tryAction(Action.WalkLeft) || this.tryAction(Action.PushLeft);
                    break;
                case "right":
                    this.tryAction(Action.WalkRight) || this.tryAction(Action.PushRight);
                    break;
                case "up":
                    this.tryAction(Action.WalkUp) || this.tryAction(Action.PushUp);
                    break;
                case "down":
                    this.tryAction(Action.WalkDown) || this.tryAction(Action.PushDown);
                    break;
                case "undo":
                    this.undo();
                    break;
                case "redo":
                    this.redo();
                    break;
            }

            this.hideTitle();
            this.board.getAnalysis().recomputeAnalysis();
            this.checkWinCondition(gameloop);
        }

        this.inputName = null;
    }

    getBoard() {
        return this.board;
    }

    focusTick(gameloop: Gameloop<GameSingleton>, scene: Scene): void {
        if (this.winTimer > 0) {
            return;
        }

        const input = gameloop.input();

        this.inputName = input.autoRepeatNewest(["left", "right", "up", "down", "undo", "redo"]);

        if (input.justPressed("accept")) {
            this.hideTitle();
        }

        if (this.inputName === null && input.justPressed("menu")) {
            scene.pushEvent("openMenu");
            this.titleTimer = 0;
        }
    }

    tick(gameloop: Gameloop<GameSingleton>, _scene: Scene): void {
        if (this.winTimer <= 0) {
            this.gameActiveTick(gameloop);
        } else {
            this.gameWonTick(gameloop);
        }

        this.board.lerpTick();

        if (this.titleTimer > 0) {
            this.titleTimer--;

            if (this.titleTimer <= 0) {
                this.getScene().pushEvent("titleTimedOut");
            }
        }

        this.keepActive(FOCUS_PRIORITY_PLAY);
    }

    draw(gameloop: Gameloop<GameSingleton>, _scene: Scene, lerpTime: number): void {
        const renderer = gameloop.renderer();

        this.board.draw(renderer, lerpTime);

        if (this.confetti) {
            this.confetti.draw(renderer, lerpTime);
        }
        if (this.titleTimer > 0) {
            const strings = gameloop.singleton.getLevelStrings();
            const centerX = renderer.canvas().width / 2;
            const centerY = renderer.canvas().height / 2;

            this.font.drawTextCentered(
                renderer,
                strings.collection,
                centerX,
                centerY - 36,
                TITLE_MAX_WIDTH,
                1
            );
            this.font.drawTextCentered(
                renderer,
                strings.name,
                centerX,
                centerY - 8,
                TITLE_MAX_WIDTH,
                1
            );
            this.font.drawTextCentered(
                renderer,
                `by ${strings.author}`,
                centerX,
                centerY + 20,
                TITLE_MAX_WIDTH,
                1
            );
        }
    }
}
