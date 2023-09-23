import { Gameloop } from "../../engine/gameloop";
import { Picture } from "../../engine/graphics";
import { DrawLogic, Scene, TickLogic } from "../../engine/scene";
import { centered } from "../../engine/util";
import { GameSingleton } from "../singleton";
import { Focusable, FocusableScene } from "../global/focus";
import { Board, BoardTokenType, TokenToSpawn } from "../board/board";

import * as gameAtlas32Json from "../../res/GameAtlas32.json";
import { Player } from "./player";
import { Crate } from "./crate";

const game32Slices = gameAtlas32Json;

const FOCUS_PRIORITY_PLAY = 0;

export class PlayLogic extends Focusable implements TickLogic, DrawLogic {
    private picture: Picture = new Picture("res/GameAtlas32.png");
    private board: Board;

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

    focusTick(gameloop: Gameloop<GameSingleton>, scene: Scene): void {
        const input = gameloop.input();

        if (input.justPressed("menu")) {
            scene.pushEvent("openMenu");
        }
    }

    tick(_gameloop: Gameloop, _scene: Scene): void {
        this.keepActive(FOCUS_PRIORITY_PLAY);
    }

    draw(gameloop: Gameloop, _scene: Scene, _lerpTime: number): void {
        const renderer = gameloop.renderer();

        this.board.draw(renderer);
    }
}
