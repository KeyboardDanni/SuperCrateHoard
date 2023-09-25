import { Picture, PictureSlice, Renderer } from "../../engine/graphics";
import { Board, BoardTileType } from "./board";

export interface Position {
    x: number;
    y: number;
}

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
    private x: number = 0;
    private y: number = 0;
    picture: Picture | null = null;
    slice: PictureSlice = new PictureSlice(0, 0, 0, 0);
    solid = true;
    readonly board: Board;

    constructor(x: number, y: number, board: Board) {
        this.x = x;
        this.y = y;
        this.board = board;
    }

    getPosition(): Position {
        return { x: this.x, y: this.y };
    }

    setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
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

    draw(renderer: Renderer, targetX: number, targetY: number) {
        if (this.picture) {
            renderer.drawSprite(this.picture, this.slice, targetX, targetY);
        }
    }
}
