export default class ChessMinUi {
  constructor(game) {
    this.game = game;
    this.boardElement = document.querySelector(".board");
    this.statusElement = document.querySelector(".current-player");
    this.playerStatsElement = document.querySelector(".player-stats");
    if (!this.boardElement || !this.statusElement || !this.playerStatsElement) {
      throw new Error("必要的DOM元素未找到");
    }
  }

  render() {
    this.renderBoard();
    this.updateStatus();
    this.updatePlayerStats();
    if (this.game.lastMove) {
      this.showLastMove(this.game.lastMove);
    }
    const storedStyle = localStorage.getItem("style");
    if (storedStyle) {
      this.changePieceStyle(storedStyle);
    }
  }

  renderBoard() {
    this.boardElement.innerHTML = "";
    for (let i = 0; i < this.game.BOARD_SIZE; i++) {
      for (let j = 0; j < this.game.BOARD_SIZE; j++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.row = i;
        cell.dataset.col = j;
        if (this.game.board[i][j] !== this.game.EMPTY) {
          const piece = document.createElement("div");
          piece.classList.add(
            "piece",
            this.game.board[i][j] === this.game.PLAYER_A
              ? "player-a"
              : "player-b",
          );
          cell.appendChild(piece);
        }
        this.boardElement.appendChild(cell);
      }
    }
  }

  updateStatus() {
    const color =
      getComputedStyle(document.documentElement).getPropertyValue(
        "--piece-bg-color",
      ) || "green"; // 默认颜色为绿色
    const dotColor =
      this.game.currentPlayer === this.game.PLAYER_A ? "red" : color.trim(); // 红方用红色，黑方用棋子颜色

    this.statusElement.innerHTML = `回合：<span class="current-turn-dot" style="color: ${dotColor}">&#x25CF;</span>`;
  }

  updatePlayerStats() {
    const color =
      getComputedStyle(document.documentElement).getPropertyValue(
        "--piece-bg-color",
      ) || "green"; // 默认颜色为绿色

    this.playerStatsElement.innerHTML = `
            <span class="red-dot">&#x25CF; ${this.game.playerAPieces}</span>
            <span class="black-dot" style="color: ${color}">&#x25CF; ${this.game.playerBPieces}</span>
        `;
  }

  showLastMove(move) {
    if (!move) return;

    const [fromRow, fromCol] = move.from;
    const [toRow, toCol] = move.to;

    // 添加特殊的高亮样式显示起点和终点
    const fromCell = this.boardElement.querySelector(
      `[data-row="${fromRow}"][data-col="${fromCol}"]`,
    );
    const toCell = this.boardElement.querySelector(
      `[data-row="${toRow}"][data-col="${toCol}"]`,
    );

    if (fromCell && toCell) {
      fromCell.classList.add("last-move-from");
      toCell.classList.add("last-move-to");
    }
  }

  applyCaptureAnimation(capturedPosition) {
    console.log("给被吃的棋子添加动画中:", capturedPosition);
    const [row, col] = capturedPosition;
    const cell = this.boardElement.querySelector(
      `[data-row="${row}"][data-col="${col}"]`,
    );

    if (cell) {
      // 添加淡红色背景
      cell.style.backgroundColor = "#FA8072";

      // 创建一个淡出效果
      cell.style.transition = "background-color 1s ease-out";

      // 设置一个定时器，在一段时间后恢复原来的颜色
      setTimeout(() => {
        cell.style.backgroundColor = "";

        // 移除棋子
        const piece = cell.querySelector(".piece");
        if (piece) {
          piece.remove();
        }
      }, 1000); // 1000毫秒 = 1秒
    } else {
      console.log("未找到要添加动画的元素");
    }
  }

  highlightCell(row, col) {
    const cell = this.boardElement.querySelector(
      `[data-row="${row}"][data-col="${col}"]`,
    );
    if (cell) {
      cell.classList.add("selected");
    }
  }

  // 高亮可移动的位置
  highlightValidMoves(moves) {
    moves.forEach((move) => {
      const [row, col] = move.to;
      const cell = this.boardElement.querySelector(
        `[data-row="${row}"][data-col="${col}"]`,
      );
      if (cell) {
        cell.classList.add("valid-move");
      }
    });
  }

  // 清除所有高亮
  clearHighlights() {
    const cells = this.boardElement.querySelectorAll(".cell");
    cells.forEach((cell) => {
      cell.classList.remove(
        "selected",
        "valid-move",
        "last-move-from",
        "last-move-to",
      );
    });
  }
}
