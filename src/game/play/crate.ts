import { BoardToken, Direction, directionToOffset } from "../board/token";
import { Board, BoardTileType } from "../board/board";

export class Crate extends BoardToken {
    private theme;

    constructor(x: number, y: number, board: Board) {
        super(x, y, board);

        const tile = board.tile(x, y);

        this.picture = board.picture;
        this.theme = board.slices;
        this.slice = this.theme.crate[tile === BoardTileType.Dropzone ? 1 : 0];
    }

    tryPush(direction: Direction) {
        const pos = this.getPosition();
        const offset = directionToOffset(direction);
        const newX = pos.x + offset.x;
        const newY = pos.y + offset.y;

        if (this.isFree(newX, newY)) {
            this.board.moveToken(this, newX, newY);
            this.setPosition(newX, newY);

            const tile = this.board.tile(newX, newY);
            this.slice = this.theme.crate[tile === BoardTileType.Dropzone ? 1 : 0];

            return true;
        }

        return false;
    }

    tryPull(puller: BoardToken, direction: Direction) {
        const pos = this.getPosition();
        const offset = directionToOffset(direction);
        const newX = pos.x + offset.x;
        const newY = pos.y + offset.y;

        if (!this.isTileFree(newX, newY)) {
            return false;
        }

        const tokens = this.board.tokensForTile(newX, newY);

        for (const token of tokens) {
            if (token.solid && token !== puller) {
                return false;
            }
        }

        this.board.moveToken(this, newX, newY);
        this.setPosition(newX, newY);

        const tile = this.board.tile(newX, newY);
        this.slice = this.theme.crate[tile === BoardTileType.Dropzone ? 1 : 0];

        return true;
    }
}
