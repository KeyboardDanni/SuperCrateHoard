import { Gameloop } from "../../engine/gameloop";
import { Picture } from "../../engine/graphics";
import { DrawLogic, Scene, TickLogic } from "../../engine/scene";
import { centered } from "../../engine/util";
import { GameSingleton } from "../singleton";
import { makeMenuScene } from "../menu/menuscene";
import { Focusable, FocusableScene } from "../global/focus";
import { Board, BoardTileType } from "../board/board";
import { BoardTokenType, Direction, TokenToSpawn } from "../board/token";
import { Orientation, Player } from "./player";
import { Crate } from "./crate";

import * as gameAtlas32Json from "../../res/GameAtlas32.json";
import { Confetti } from "./confetti";

const game32Slices = gameAtlas32Json;

const FOCUS_PRIORITY_PLAY = 0;
const WIN_FRAMES = 300;

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
    private board: Board;
    private action: string | null = null;
    private history: Action[] = [];
    private redoHistory: Action[] = [];
    private winTimer = 0;
    private confetti: Confetti | null = null;

    constructor(gameloop: Gameloop<GameSingleton>, scene: FocusableScene) {
        super(scene);

        const singleton = gameloop.singleton;
        const collection = singleton.levels[singleton.currentCollection];

        if (!collection) throw new Error("Missing collection");

        const level = collection.levels[singleton.currentLevel];

        if (!level) throw new Error("Missing level");

        this.board = Board.fromLevel(level, this.picture, game32Slices, (board, tokensToSpawn) => {
            this.makeTokens(board, tokensToSpawn);
        });

        const canvas = gameloop.renderer().canvas();

        this.board.x = centered(this.board.width * this.board.tileWidth, canvas.width);
        this.board.y = centered(this.board.height * this.board.tileHeight, canvas.height);
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

    private tryPush(direction: Direction) {
        const player = this.getPlayer();

        if (!player) return false;

        return player.tryPush(direction);
    }

    private tryPull(direction: Direction) {
        const player = this.getPlayer();

        if (!player) return false;

        return player.tryPull(direction);
    }

    private doAction(action: Action): boolean {
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
                return this.tryPush(Direction.Left);
            case Action.PushRight:
                return this.tryPush(Direction.Right);
            case Action.PushUp:
                return this.tryPush(Direction.Up);
            case Action.PushDown:
                return this.tryPush(Direction.Down);
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
                return this.tryPull(Direction.Right);
            case Action.PushRight:
                return this.tryPull(Direction.Left);
            case Action.PushUp:
                return this.tryPull(Direction.Down);
            case Action.PushDown:
                return this.tryPull(Direction.Up);
        }
    }

    private tryAction(action: Action): boolean {
        if (this.doAction(action)) {
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

        if (this.doAction(action)) {
            this.redoHistory.pop();
            this.history.push(action);
            return true;
        }

        return false;
    }

    private checkWinCondition() {
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
        }
    }

    private gameWonTick(gameloop: Gameloop) {
        const player = this.getPlayer();

        if (player) {
            player.winAnimation();
        }

        if (!this.confetti) {
            const canvas = gameloop.renderer().canvas();

            this.confetti = new Confetti(
                canvas.width / 2,
                canvas.height / 2,
                this.board.picture,
                this.board.slices
            );
        }

        this.confetti.tick();

        if (this.winTimer >= WIN_FRAMES) {
            gameloop.setScene(() => {
                return makeMenuScene(gameloop.input());
            });
        }

        this.winTimer++;
    }

    private gameActiveTick() {
        if (this.action) {
            switch (this.action) {
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

            this.checkWinCondition();
        }

        this.action = null;
    }

    focusTick(gameloop: Gameloop<GameSingleton>, scene: Scene): void {
        if (this.winTimer > 0) {
            return;
        }

        const input = gameloop.input();

        this.action = input.autoRepeatNewest(["left", "right", "up", "down", "undo", "redo"]);

        if (this.action === null && input.justPressed("menu")) {
            scene.pushEvent("openMenu");
        }
    }

    tick(gameloop: Gameloop, _scene: Scene): void {
        if (this.winTimer <= 0) {
            this.gameActiveTick();
        } else {
            this.gameWonTick(gameloop);
        }

        this.keepActive(FOCUS_PRIORITY_PLAY);
    }

    draw(gameloop: Gameloop, _scene: Scene, lerpTime: number): void {
        const renderer = gameloop.renderer();

        this.board.draw(renderer);

        if (this.confetti) {
            this.confetti.draw(renderer, lerpTime);
        }
    }
}
