import { Position } from "../../engine/util";
import { Board, BoardTileType } from "./board";
import { Direction, directionToOffset, oppositeDirection } from "./token";

export const enum AnalysisMode {
    None,
    StaticCorners,
    EnumMax,
}

export const enum AnalysisActionMode {
    Show,
    Prevent,
    ShowPrevent,
    EnumMax,
}

class CornerWalker {
    start: Position;
    delta: Position;
    check: Position;

    constructor(x: number, y: number, direction: Direction, huggedWall: Direction) {
        this.start = { x: x, y: y };
        this.delta = directionToOffset(direction);
        this.check = directionToOffset(huggedWall);
    }
}

export class BoardAnalysis {
    private board;
    private restricted: boolean[];
    private analysisMode = AnalysisMode.None;
    private analysisAction = AnalysisActionMode.Show;

    constructor(board: Board) {
        this.board = board;

        this.restricted = new Array(board.width * board.height);
        this.restricted.fill(false);
    }

    private setRestricted(x: number, y: number) {
        if (!this.board.posInRange(x, y)) {
            return;
        }

        this.restricted[x + y * this.board.width] = true;
    }

    private isBlocked(x: number, y: number) {
        return this.board.tile(x, y) === BoardTileType.Wall;
    }

    private recomputerStaticEdges(walkers: CornerWalker[]) {
        const maxLength = Math.max(this.board.width, this.board.height);

        nextWalker: for (const walker of walkers) {
            let x = walker.start.x;
            let y = walker.start.y;
            let length = 0;

            stopWalk: while (length < maxLength) {
                x += walker.delta.x;
                y += walker.delta.y;

                const thisTile = this.board.tile(x, y);
                const edgeTile = this.board.tile(x + walker.check.x, y + walker.check.y);

                if (
                    thisTile === BoardTileType.Wall ||
                    !this.board.posInRange(x, y) ||
                    this.isRestricted(x, y)
                ) {
                    break stopWalk;
                }

                if (thisTile === BoardTileType.Dropzone || edgeTile !== BoardTileType.Wall) {
                    continue nextWalker;
                }

                length++;
            }

            x = walker.start.x;
            y = walker.start.y;

            for (let i = 0; i < length; ++i) {
                x += walker.delta.x;
                y += walker.delta.y;

                this.setRestricted(x, y);
            }
        }
    }

    private recomputeStaticCorners() {
        const walkers: CornerWalker[] = [];

        function addWalker(x: number, y: number, a: Direction, b: Direction) {
            walkers.push(new CornerWalker(x, y, oppositeDirection(a), b));
            walkers.push(new CornerWalker(x, y, oppositeDirection(b), a));
        }

        for (let y = 0; y < this.board.height; ++y) {
            for (let x = 0; x < this.board.width; ++x) {
                const tile = this.board.tile(x, y);

                if (tile === BoardTileType.Dropzone) {
                    continue;
                }

                const left = this.isBlocked(x - 1, y);
                const right = this.isBlocked(x + 1, y);
                const up = this.isBlocked(x, y - 1);
                const down = this.isBlocked(x, y + 1);
                let restricted = false;

                if (left && up) {
                    addWalker(x, y, Direction.Left, Direction.Up);
                    restricted = true;
                }
                if (right && up) {
                    addWalker(x, y, Direction.Right, Direction.Up);
                    restricted = true;
                }
                if (left && down) {
                    addWalker(x, y, Direction.Left, Direction.Down);
                    restricted = true;
                }
                if (right && down) {
                    addWalker(x, y, Direction.Right, Direction.Down);
                    restricted = true;
                }

                if (restricted) {
                    this.setRestricted(x, y);
                }
            }
        }

        this.recomputerStaticEdges(walkers);
    }

    recomputeAnalysis() {
        this.restricted.fill(false);

        switch (this.analysisMode) {
            case AnalysisMode.None:
                break;
            case AnalysisMode.StaticCorners:
                this.recomputeStaticCorners();
                break;
        }

        this.board.setDirty();
    }

    shouldShowRestricted() {
        switch (this.analysisAction) {
            case AnalysisActionMode.Show:
            case AnalysisActionMode.ShowPrevent:
                return true;
        }

        return false;
    }

    shouldPreventRestricted() {
        switch (this.analysisAction) {
            case AnalysisActionMode.Prevent:
            case AnalysisActionMode.ShowPrevent:
                return true;
        }

        return false;
    }

    setAnalysisMode(mode: AnalysisMode, action: AnalysisActionMode) {
        this.analysisMode = mode;
        this.analysisAction = action;

        this.recomputeAnalysis();
    }

    isRestricted(x: number, y: number) {
        if (!this.board.posInRange(x, y)) {
            return false;
        }

        return this.restricted[this.board.posToIndex(x, y)];
    }
}
