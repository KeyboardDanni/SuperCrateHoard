import { BoardToken, Direction, directionToOffset } from "../board/token";
import { Board, BoardTileType } from "../board/board";

export const enum PushPullResult {
    Ok,
    Blocked,
    Restricted,
}

export class Crate extends BoardToken {
    private theme;

    constructor(x: number, y: number, board: Board) {
        super(x, y, board);

        const tile = board.tile(x, y);

        this.picture = board.picture;
        this.theme = board.slices;
        this.slice = this.theme.crate[tile === BoardTileType.Dropzone ? 1 : 0];
    }

    tryPush(direction: Direction, preventRestricted: boolean) {
        const pos = this.getPosition();
        const offset = directionToOffset(direction);
        const newX = pos.x + offset.x;
        const newY = pos.y + offset.y;

        if (this.isFree(newX, newY)) {
            if (preventRestricted && this.board.getAnalysis().isRestricted(newX, newY)) {
                return PushPullResult.Restricted;
            }

            this.board.moveToken(this, newX, newY);
            this.lerpToPosition(newX, newY);

            const tile = this.board.tile(newX, newY);
            this.slice = this.theme.crate[tile === BoardTileType.Dropzone ? 1 : 0];

            return PushPullResult.Ok;
        }

        return PushPullResult.Blocked;
    }

    tryPull(puller: BoardToken, direction: Direction, preventRestricted: boolean) {
        const pos = this.getPosition();
        const offset = directionToOffset(direction);
        const newX = pos.x + offset.x;
        const newY = pos.y + offset.y;

        if (!this.isTileFree(newX, newY)) {
            return PushPullResult.Blocked;
        }

        const tokens = this.board.tokensForTile(newX, newY);

        for (const token of tokens) {
            if (token.solid && token !== puller) {
                return PushPullResult.Blocked;
            }
        }

        if (preventRestricted && this.board.getAnalysis().isRestricted(newX, newY)) {
            return PushPullResult.Restricted;
        }

        this.board.moveToken(this, newX, newY);
        this.lerpToPosition(newX, newY);

        const tile = this.board.tile(newX, newY);
        this.slice = this.theme.crate[tile === BoardTileType.Dropzone ? 1 : 0];

        return PushPullResult.Ok;
    }
}
