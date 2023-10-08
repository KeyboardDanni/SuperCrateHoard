import { clamp } from "../../engine/util";
import { makePlayScene } from "../play/playscene";
import { AnalysisActionMode, AnalysisMode } from "../board/analysis";
import { makeMenuScene } from "../menu/menuscene";
import { ButtonItem, Menu, OnAdjustFunc, TextAlignment, TextLabelFunc } from "./optionslogic";
import { BackgroundMovementMode } from "./bgdrawer";

const REPEAT_DELAY_MIN = 15;
const REPEAT_DELAY_MAX = 60;
const REPEAT_RATE_MIN = 2;
const REPEAT_RATE_MAX = 15;

function backgroundMovementName(backgroundMovement: BackgroundMovementMode) {
    switch (backgroundMovement) {
        case BackgroundMovementMode.Full:
            return "Full";
        case BackgroundMovementMode.Reduced:
            return "Reduced";
        case BackgroundMovementMode.Off:
            return "Off";
        default:
            throw new Error("Bad enum");
    }
}

function analysisName(analysisMode: AnalysisMode) {
    switch (analysisMode) {
        case AnalysisMode.None:
            return "None";
        case AnalysisMode.StaticCorners:
            return "Static Corners/Edges";
        default:
            throw new Error("Bad enum");
    }
}

function analysisActionName(analysisAction: AnalysisActionMode) {
    switch (analysisAction) {
        case AnalysisActionMode.Show:
            return "Show Deadlocks";
        case AnalysisActionMode.Prevent:
            return "Prevent Deadlocks";
        case AnalysisActionMode.ShowPrevent:
            return "Show And Prevent Deadlocks";
        default:
            throw new Error("Bad enum");
    }
}

function preferenceChoice(
    x: number,
    y: number,
    textFunc: TextLabelFunc,
    onAdjustFunc: OnAdjustFunc
): ButtonItem {
    return {
        x: x,
        y: y,
        text: (logic, gameloop) => {
            return textFunc(logic, gameloop);
        },
        alignment: TextAlignment.Left,
        maxWidth: -1,
        maxLines: 1,
        onActivate: () => {},
        onAdjust: (amount, logic, gameloop) => {
            onAdjustFunc(amount, logic, gameloop);

            const prefs = gameloop.singleton.preferences;
            logic.getScene().pushEvent("preferencesChanged", prefs);
            prefs.toLocalStorage();
        },
    };
}

export const OPTIONS_SETTINGS: Menu = {
    width: 640,
    height: 288,
    buttons: [
        preferenceChoice(
            64,
            64,
            (_logic, gameloop) => {
                const prefs = gameloop.singleton.preferences;
                const value = prefs.repeatDelay;

                return `Key Repeat Delay: ${value}`;
            },
            (amount, _logic, gameloop) => {
                const prefs = gameloop.singleton.preferences;
                prefs.repeatDelay = clamp(
                    prefs.repeatDelay + amount,
                    REPEAT_DELAY_MIN,
                    REPEAT_DELAY_MAX
                );
            }
        ),
        preferenceChoice(
            64,
            96,
            (_logic, gameloop) => {
                const prefs = gameloop.singleton.preferences;
                const value = prefs.repeatRate;

                return `Key Repeat Rate: ${value}`;
            },
            (amount, _logic, gameloop) => {
                const prefs = gameloop.singleton.preferences;
                prefs.repeatRate = clamp(
                    prefs.repeatRate + amount,
                    REPEAT_RATE_MIN,
                    REPEAT_RATE_MAX
                );
            }
        ),
        preferenceChoice(
            64,
            128,
            (_logic, gameloop) => {
                const prefs = gameloop.singleton.preferences;
                const name = backgroundMovementName(prefs.backgroundMovement);

                return `Background Movement: ${name}`;
            },
            (amount, _logic, gameloop) => {
                const prefs = gameloop.singleton.preferences;
                prefs.backgroundMovement =
                    (prefs.backgroundMovement + BackgroundMovementMode.EnumMax + amount) %
                    BackgroundMovementMode.EnumMax;
            }
        ),
        preferenceChoice(
            64,
            160,
            (_logic, gameloop) => {
                const prefs = gameloop.singleton.preferences;
                const name = analysisName(prefs.analysis);

                return `Deadlock Analysis: ${name}`;
            },
            (amount, _logic, gameloop) => {
                const prefs = gameloop.singleton.preferences;
                prefs.analysis =
                    (prefs.analysis + AnalysisMode.EnumMax + amount) % AnalysisMode.EnumMax;
            }
        ),
        preferenceChoice(
            64,
            192,
            (_logic, gameloop) => {
                const prefs = gameloop.singleton.preferences;
                const name = analysisActionName(prefs.analysisAction);

                return `Analysis Action: ${name}`;
            },
            (amount, _logic, gameloop) => {
                const prefs = gameloop.singleton.preferences;
                prefs.analysisAction =
                    (prefs.analysisAction + AnalysisActionMode.EnumMax + amount) %
                    AnalysisActionMode.EnumMax;
            }
        ),
        {
            x: 0,
            y: 256,
            text: () => "Back",
            alignment: TextAlignment.Center,
            maxWidth: -1,
            maxLines: 1,
            onActivate: (logic) => {
                logic.back();
            },
            onAdjust: () => {},
        },
    ],
    labels: [
        {
            x: 0,
            y: 16,
            alignment: TextAlignment.Center,
            maxWidth: -1,
            maxLines: 1,
            text: () => "Game Settings",
        },
    ],
};

export const OPTIONS_MAIN: Menu = {
    width: 640,
    height: 288,
    buttons: [
        {
            x: 0,
            y: 160,
            text: (logic) => (logic.isIngame() ? "Continue" : "Close This Menu"),
            alignment: TextAlignment.Center,
            maxWidth: -1,
            maxLines: 1,
            onActivate: (logic) => {
                logic.close();
            },
            onAdjust: () => {},
        },
        {
            x: 0,
            y: 192,
            text: (logic) => (logic.isIngame() ? "Restart" : "Play Level"),
            alignment: TextAlignment.Center,
            maxWidth: -1,
            maxLines: 1,
            onActivate: (_logic, gameloop) => {
                gameloop.setScene(() => {
                    return makePlayScene(gameloop);
                });
            },
            onAdjust: () => {},
        },
        {
            x: 0,
            y: 224,
            text: () => "Settings",
            alignment: TextAlignment.Center,
            maxWidth: -1,
            maxLines: 1,
            onActivate: (logic, _gameloop) => {
                logic.enterMenu(OPTIONS_SETTINGS);
            },
            onAdjust: () => {},
        },
        {
            x: 0,
            y: 256,
            text: () => "Main Menu",
            alignment: TextAlignment.Center,
            maxWidth: -1,
            maxLines: 1,
            onActivate: (_logic, gameloop) => {
                gameloop.setScene(() => {
                    return makeMenuScene(gameloop);
                });
            },
            onAdjust: () => {},
        },
    ],
    labels: [
        {
            x: 0,
            y: 16,
            alignment: TextAlignment.Center,
            maxWidth: -1,
            maxLines: 1,
            text: (_logic, gameloop) => {
                const singleton = gameloop.singleton;
                const strings = singleton.getLevelStrings();

                return `Levelset: ${strings.collection}`;
            },
        },
        {
            x: 16,
            y: 48,
            alignment: TextAlignment.Left,
            maxWidth: 608,
            maxLines: 1,
            text: (_logic, gameloop) => {
                const singleton = gameloop.singleton;
                const strings = singleton.getLevelStrings();

                return strings.name;
            },
        },
        {
            x: 16,
            y: 80,
            alignment: TextAlignment.Left,
            maxWidth: 608,
            maxLines: 2,
            text: (_logic, gameloop) => {
                const singleton = gameloop.singleton;
                const strings = singleton.getLevelStrings();

                return `by ${strings.author}`;
            },
        },
    ],
};
