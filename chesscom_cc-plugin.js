// ==UserScript==
// @name        Chess Compass Analysis for Chess.com
// @match       https://www.chess.com/*
// @run-at      document-end
// @grant       none
// @version     1.0
// @author      AndyVuj24
// @description Adds a button on next to the chess board to analyze the current game using the move list on the panel to the right
// @downloadURL https://raw.githubusercontent.com/andyvuj24/Chess-Compass-Analysis-for-Chess.com/main/chesscom_cc-plugin.js
// @supportURL  https://github.com/andyvuj24/Chess-Compass-Analysis-for-Chess.com/issues
// @homepageURL https://github.com/andyvuj24/Chess-Compass-Analysis-for-Chess.com
// ==/UserScript==

var counter = 0;

async function addStyling() {
  // button styling
  const styleElement = document.createElement("style");
  styleElement.innerHTML = `.chess-compass-button-container{margin:auto;display:flex;align-items:center;justify-content:center;border-radius:3px;color:#fff;font-size:16px}.chess-compass-button-container>a{width:100%}.chess-compass-button{background-color:#489e5d;width:100%;margin:auto;height:40px;display:flex;align-items:center;justify-content:center;border-radius:3px 3px 0 0;color:#fff;cursor:pointer;font-size:16px;font-weight:500;}.chess-compass-button:hover{background-color:#57b26e}.chess-compass-data{display:none}`;
  document.getElementsByTagName("head")[0].appendChild(styleElement);
}

async function addButton(element) {
  console.log(`element: ${element}`);
  // for button element
  const divPGN = document.createElement("div");
  divPGN.innerHTML =
    '<div id="btnPGN" class="chess-compass-button-container"><button class="chess-compass-button">Analyze PGN with Chess Compass</button></div>';
  const divFEN = document.createElement("div");
  divFEN.innerHTML =
    '<div id="btnFEN" class="chess-compass-button-container"><button class="chess-compass-button">Analyze FEN with Chess Compass</button></div>';

  sibling = document.querySelector(element);
  if (sibling !== null) {
    sibling.parentNode.insertBefore(divFEN, sibling);
    sibling.parentNode.insertBefore(divPGN, sibling);
  } else {
    return false;
  }
}

async function setupButton(id) {
  let btn = document.querySelector(id);
  console.log("TEST!");
  if (/PGN/.test(id)) {
    btn.addEventListener("click", function () {
      let selector = document.querySelector("chess-board");
      let data;
      if (selector !== null) {
        data = selector.game.getPGN().replace(/\[[^\]]*\]|\{[^\}]*\}/g, "");
        // .replace(/\{[^\}]*\}|\[.+?\]|[\r\n]+|\d+\.\.+|\s\s+/g, "")
        // .replace(/\s\s+/g, " ");
      } else {
        selector = document.querySelectorAll(
          "div.vertical-move-list-component span.vertical-move-list-column:not(.move-timestamps-component)"
        );
        if (!selector.length) {
          console.log("Unable to find data for PGN");
          return;
        }
        data = [...selector]
          .map((e) => {
            return e.innerText;
          })
          .join(" ");
      }

      console.log("PGN: " + data);
      fetch("https://www.chesscompass.com/api/get_game_id", {
        method: "post",
        body: JSON.stringify({
          gameData: data,
        }),
      })
        .then(function (p) {
          return p.json();
        })
        .then((data) =>
          window.open(
            "https://www.chesscompass.com/analyze/" + data.gameId,
            "_blank"
          )
        );
    });
  }
  if (/FEN/.test(id)) {
    btn.addEventListener("click", function () {
      let data;
      let selector = document.querySelector("chess-board");
      if (selector !== null) {
        data = selector.game.getFEN();
      } else {
        selector = document.querySelector("div.v-board");
        if (selector === null) {
          console.log("Unable to find data for FEN");
          return;
        }
        data = selector.getChessboardInstance().state.selectedNode.fen;
      }
      console.log("FEN: " + data);
      fetch("https://www.chesscompass.com/api/get_game_id", {
        method: "post",
        body: JSON.stringify({
          gameData: data,
        }),
      })
        .then(function (p) {
          return p.json();
        })
        .then((data) =>
          window.open(
            "https://www.chesscompass.com/analyze/" + data.gameId,
            "_blank"
          )
        );
    });
  }
}

async function waitForContainer() {
  const existCondition = setInterval(function () {
    [
      ".sidebar-component",
      ".sidebar-v5-component",
      "vertical-move-list",
    ].forEach((element) => {
      if (document.querySelectorAll(element).length) {
        clearInterval(existCondition);
        main(element);
        return;
      }
      if (counter > 600) {
        console.log("No sidebars found...");
        clearInterval(existCondition);
      }
    });
    counter++;
  }, 100); // check every 100ms
}

async function main(element) {
  await addStyling();
  await addButton(element);
  await setupButton("#btnPGN");
  await setupButton("#btnFEN");
}

if (
  document.readyState === "complete" ||
  (document.readyState !== "loading" && !document.documentElement.doScroll)
) {
  waitForContainer();
} else {
  document.addEventListener("DOMContentLoaded", waitForContainer);
}
