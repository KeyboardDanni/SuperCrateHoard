import { Position, clamp, lerp } from "../../engine/util";
import { Picture, PictureSlice, Renderer } from "../../engine/graphics";
import { Board, BoardTileType } from "./board";

const LERP_RATE = 0.2;
const LAST_MOVE_RATE = 0.02;
const LERP_JUMP_AHEAD_CAP = 0.15;

export enum Direction {
    Left,
    Right,
    Up,
    Down,
}

export interface TokenToSpawn {
    x: number;
    y: number;
    tokenType: BoardTokenType;
}

export function directionToOffset(direction: Direction): Position {
    switch (direction) {
        case Direction.Left:
            return { x: -1, y: 0 };
        case Direction.Right:
            return { x: 1, y: 0 };
        case Direction.Up:
            return { x: 0, y: -1 };
        case Direction.Down:
            return { x: 0, y: 1 };
    }
}

export function oppositeDirection(direction: Direction) {
    switch (direction) {
        case Direction.Left:
            return Direction.Right;
        case Direction.Right:
            return Direction.Left;
        case Direction.Up:
            return Direction.Down;
        case Direction.Down:
            return Direction.Up;
    }
}

export enum BoardTokenType {
    Player,
    Crate,
}

export class BoardToken {
    private x;
    private y;
    private oldX;
    private oldY;
    private oldLerpTimer = 0;
    private lerpTimer = 0;
    private lastMoveTimer = 0;
    picture: Picture | null = null;
    slice: PictureSlice = new PictureSlice(0, 0, 0, 0);
    solid = true;
    readonly board: Board;

    constructor(x: number, y: number, board: Board) {
        this.x = x;
        this.y = y;
        this.oldX = x;
        this.oldY = y;
        this.board = board;
    }

    getPosition(): Position {
        return { x: this.x, y: this.y };
    }

    setPosition(x: number, y: number) {
        this.oldX = this.x;
        this.oldY = this.y;
        this.x = x;
        this.y = y;
        this.oldLerpTimer = 1;
        this.lerpTimer = 1;
        this.lastMoveTimer = 1;
    }

    lerpToPosition(x: number, y: number) {
        // Speed up lerp if movement is rapid enough
        const lerpTime = Math.max(this.lastMoveTimer, LERP_JUMP_AHEAD_CAP);
        this.oldX = lerp(x, this.x, lerpTime);
        this.oldY = lerp(y, this.y, lerpTime);

        this.x = x;
        this.y = y;
        this.oldLerpTimer = 0;
        this.lerpTimer = 0;
        this.lastMoveTimer = 0;
    }

    getBoardPosition(): Position {
        const x = this.x * this.board.tileWidth + this.board.x;
        const y = this.y * this.board.tileHeight + this.board.y;

        return { x: x, y: y };
    }

    isTileFree(x: number, y: number) {
        const tileType = this.board.tile(x, y);

        if (tileType === BoardTileType.Wall) {
            return false;
        }

        return true;
    }

    isTokenFree(x: number, y: number) {
        const tokens = this.board.tokensForTile(x, y);

        for (const token of tokens) {
            if (token.solid) {
                return false;
            }
        }

        return true;
    }

    isFree(x: number, y: number) {
        return this.isTileFree(x, y) && this.isTokenFree(x, y);
    }

    lerpTick() {
        this.oldLerpTimer = this.lerpTimer;
        this.lerpTimer = clamp(this.lerpTimer + LERP_RATE, 0, 1);
        this.lastMoveTimer = clamp(this.lastMoveTimer + LAST_MOVE_RATE, 0, 1);
    }

    draw(renderer: Renderer, frameLerp: number) {
        if (!this.picture) {
            return;
        }

        const targetPos = this.board.boardToWorldCoords(this.x, this.y);
        const oldPos = this.board.boardToWorldCoords(this.oldX, this.oldY);

        const lerpedLerp = lerp(this.oldLerpTimer, this.lerpTimer, frameLerp);
        const easing = Math.pow(lerpedLerp, 0.3);
        const x = lerp(oldPos.x, targetPos.x, easing);
        const y = lerp(oldPos.y, targetPos.y, easing);

        if (this.picture) {
            renderer.drawSprite(this.picture, this.slice, x, y);
        }
    }
}
