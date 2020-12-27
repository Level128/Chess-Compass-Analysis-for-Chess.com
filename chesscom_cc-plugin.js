// ==UserScript==
// @name        Chess Compass Analysis for Chess.com
// @match       https://www.chess.com/*
// @run-at      document-end
// @grant       none
// @version     1.2
// @author      AndyVuj24
// @description This plugin adds buttons next to the chess board allowing for a quick post-game analysis of the current game on screen
// @downloadURL https://raw.githubusercontent.com/andyvuj24/Chess-Compass-Analysis-for-Chess.com/main/chesscom_cc-plugin.js
// @updateURL https://raw.githubusercontent.com/andyvuj24/Chess-Compass-Analysis-for-Chess.com/main/chesscom_cc-plugin.js
// @supportURL  https://github.com/andyvuj24/Chess-Compass-Analysis-for-Chess.com/issues
// @homepageURL https://github.com/andyvuj24/Chess-Compass-Analysis-for-Chess.com
// ==/UserScript==

var counter = 0;

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const log = (message) => {
  console.log(`[Chess.com Plugin Log]: ${message}`);
};

const addStyling = async () => {
  // button styling
  log("Adding styling to page for plugin buttons");
  const styleElement = document.createElement("style");
  styleElement.innerHTML = `.gf-chess-compass-button-container{margin:auto;display:flex;align-items:center;justify-content:center;border-radius:3px;color:#fff;font-size:16px}.gf-chess-compass-button-container>a{width:100%}.gf-chess-compass-button{background-color:#489e5d;width:100%;margin:auto;height:40px;display:flex;align-items:center;justify-content:center;border-radius:3px 3px 0 0;color:#fff;cursor:pointer;font-size:16px;font-weight:500;}.gf-chess-compass-button:hover{background-color:#57b26e}`;
  $("head")?.appendChild(styleElement);
};

const addButtons = async (element) => {
  // for button element
  log("Adding buttons to sidebar");
  $(element)?.insertAdjacentHTML(
    "beforebegin",
    '<div><div id="btnPGN" class="gf-chess-compass-button-container"><button class="gf-chess-compass-button">Analyze PGN with Chess Compass</button></div></div>'
  );
  $(element)?.insertAdjacentHTML(
    "beforebegin",
    '<div><div id="btnFEN" class="gf-chess-compass-button-container"><button class="gf-chess-compass-button">Analyze FEN with Chess Compass</button></div></div>'
  );
};

const setupButton = async (id) => {
  log(`Configuring button -> ${id}`);
  const btn = $(id);
  if (id.indexOf("PGN") !== -1) {
    btn.addEventListener("click", function () {
      const data =
        ($("chess-board")
          ?.game.getPGN?.()
          .replace(/\[[^\]]*\]|\{[^\}]*\}/g, "") ||
          [
            ...$$(
              "div.vertical-move-list-component span.vertical-move-list-column:not(.move-timestamps-component)"
            ),
          ]
            .map(({ innerText }) => innerText)
            .join(" ")
            .replace(/\[[^\]]*\]|\{[^\}]*\}/g, "")) ??
        null;
      if (!data) {
        log("Unable to find data for PGN");
        return;
      }

      log("PGN: " + data);
      fetch("https://www.chesscompass.com/api/get_game_id", {
        method: "post",
        body: JSON.stringify({
          gameData: data,
        }),
      })
        .then((response) => {
          return response.json();
        })
        .then(({ gameId }) => {
          window.open(
            "https://www.chesscompass.com/analyze/" + gameId,
            "_blank"
          );
        });
    });
  }

  if (id.indexOf("FEN") !== -1) {
    btn.addEventListener("click", function () {
      const data =
        ($("chess-board")?.game.getFEN?.() ||
          $("div.v-board")?.getChessboardInstance?.().state.selectedNode.fen) ??
        null;
      if (!data) {
        log("Unable to find data for FEN");
        return;
      }
      log("FEN: " + data);
      fetch("https://www.chesscompass.com/api/get_game_id", {
        method: "post",
        body: JSON.stringify({
          gameData: data,
        }),
      })
        .then((response) => {
          return response.json();
        })
        .then(({ gameId }) => {
          window.open(
            "https://www.chesscompass.com/analyze/" + gameId,
            "_blank"
          );
        });
    });
  }
};

const waitForContainer = async () => {
  const existCondition = setInterval(function () {
    [
      ".sidebar-component",
      ".sidebar-v5-component",
      "vertical-move-list",
    ].forEach((element) => {
      if ($(element)) {
        clearInterval(existCondition);
        main(element);
        return;
      }
      if (counter > 600) {
        log("No sidebars found for us to use...");
        clearInterval(existCondition);
      }
    });
    counter++;
  }, 100); // check every 100ms
};

const clearAds = async () => {
  log("Clearing ads...");
  const adsToRemove = [
    "#tall-sidebar-ad",
    "#adblocker-check",
    "#board-layout-ad",
  ];
  adsToRemove.forEach((selector) => {
    $$(selector).forEach((ele) => {
      ele.remove();
    });
  });
  log("Ads cleared!");
};

async function main(element) {
  await addStyling();
  await addButtons(element);
  await setupButton("#btnPGN");
  await setupButton("#btnFEN");
  await clearAds();
}

if (
  document.readyState === "complete" ||
  (document.readyState !== "loading" && !document.documentElement.doScroll)
) {
  waitForContainer();
} else {
  document.addEventListener("DOMContentLoaded", waitForContainer);
}
