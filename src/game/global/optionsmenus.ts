import { makePlayScene } from "../play/playscene";
import { AnalysisActionMode, AnalysisMode } from "../board/analysis";
import { makeMenuScene } from "../menu/menuscene";
import { Menu, TextAlignment } from "./optionslogic";

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

export const OPTIONS_SETTINGS: Menu = {
    width: 640,
    height: 192,
    buttons: [
        {
            x: 64,
            y: 64,
            text: (_logic, gameloop) => {
                const prefs = gameloop.singleton.preferences;
                const name = analysisName(prefs.analysis);

                return `Deadlock Analysis: ${name}`;
            },
            alignment: TextAlignment.Left,
            maxWidth: -1,
            maxLines: 1,
            onActivate: () => {},
            onAdjust: (amount, logic, gameloop) => {
                const prefs = gameloop.singleton.preferences;
                prefs.analysis =
                    (prefs.analysis + AnalysisMode.EnumMax + amount) % AnalysisMode.EnumMax;
                logic.getScene().pushEvent("preferencesChanged", prefs);
                prefs.toLocalStorage();
            },
        },
        {
            x: 64,
            y: 96,
            text: (_logic, gameloop) => {
                const prefs = gameloop.singleton.preferences;
                const name = analysisActionName(prefs.analysisAction);

                return `Analysis Action: ${name}`;
            },
            alignment: TextAlignment.Left,
            maxWidth: -1,
            maxLines: 1,
            onActivate: () => {},
            onAdjust: (amount, logic, gameloop) => {
                const prefs = gameloop.singleton.preferences;
                prefs.analysisAction =
                    (prefs.analysisAction + AnalysisActionMode.EnumMax + amount) %
                    AnalysisActionMode.EnumMax;
                logic.getScene().pushEvent("preferencesChanged", prefs);
                prefs.toLocalStorage();
            },
        },

        {
            x: 0,
            y: 160,
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
                    return makeMenuScene(gameloop.input());
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

                const collection = singleton.levels[singleton.currentCollection];

                if (!collection) {
                    return "";
                }

                return `Levelset: ${collection.name}`;
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

                const collection = singleton.levels[singleton.currentCollection];

                if (!collection) {
                    return "";
                }

                const level = collection.levels[singleton.currentLevel];
                let name = `Level ${singleton.currentLevel + 1}`;

                if (!level) {
                    return "";
                }

                if (level.name && level.name.length > 0) {
                    name += `: ${level.name}`;
                }

                return name;
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

                const collection = singleton.levels[singleton.currentCollection];

                if (!collection) {
                    return "";
                }

                const level = collection.levels[singleton.currentLevel];

                if (!level) {
                    return "";
                }

                let author = "Anonymous";

                if (level.author && level.author.length > 0) {
                    author = level.author;
                } else if (collection.author.length > 0) {
                    author = collection.author;
                }

                return `by ${author}`;
            },
        },
    ],
};
