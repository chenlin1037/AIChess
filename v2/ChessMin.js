import ChessGame from "./ChessGame.js";
import GameUI from "./ChessMinUi.js";
import ChessAI02 from "./ChessAI02.js";
import Timer from "./util.js";

export default class ChessMinControl {
  soundFiles = [
    "./resources/sound/lose.mp3",
    "./resources/sound/move.mp3",
    "./resources/sound/win.mp3",
    "./resources/sound/click.mp3",
    "./resources/sound/capture.mp3",
  ];

  constructor() {
    this.initializeGame();
    this.initializeAudio();
    this.initializeElements();
    localStorage.setItem("chessmin-sound-enabled", "true");

    document.querySelector(".floating").addEventListener("click", () => {
      let init = document.querySelector(".init");
      init.style.animation = "start .5s ease-in";
      init.style.top = "100%";
      this.startGame();
    });

    this.ui.render();
  }

  initializeAudio() {
    [this.lose, this.move, this.win, this.click, this.capture] =
      this.soundFiles.map((file) => new Audio(file));
  }

  initializeElements() {
    this.boardElement = document.querySelector(".board");
    this.replayElement = document.querySelector(".replay");
    this.surrenderButton = document.getElementById("surrender");
    this.settingsButton = document.getElementById("settings");
    this.settingsPanel = document.querySelector(".settings-panel");
    this.closeSettingsButton = document.getElementById("closeSettings");
    this.title1 = document.querySelector(".title1");
    this.timerTurn = document.querySelector(".timer");
    this.endTime = document.querySelector(".end-time");
    this.totalTimeElement = document.getElementById("total-time");
  }

  initEventListeners() {
    const listeners = [
      {
        element: this.boardElement,
        event: "click",
        handler: this.handleCellClick,
      },
      { element: this.replayElement, event: "click", handler: this.replay },
      {
        element: this.surrenderButton,
        event: "click",
        handler: this.surrender,
      },
    ];

    listeners.forEach(({ element, event, handler }) => {
      if (element) {
        element.addEventListener(event, handler.bind(this));
      }
    });

    this.initSettingsPanel();
  }

  initializeGame() {
    this.game = new ChessGame(); //主逻辑
    this.ui = new GameUI(this.game); //渲染
    this.ai = new ChessAI02(this.game, 2000); //AI
    this.isSoundEnabled = true;
    this.selectedPiece = null;
    this.lastMove = null;
    this.isGameOver = false;
    this.timer = null;
  }

  startGame() {
    this.initializeGame();
    this.ui.render();
    this.surrenderButton.disabled = false;

    this.clearTimer();
    this.timeLeft = 40; // 重置时间
    this.updateTimerDisplay(); // 最开始是40秒
    this.totalTime = new Timer(this.totalTimeElement);
    this.totalTime.start();

    this.initEventListeners();
    this.game.currentPlayer === this.game.PLAYER_A
      ? this.makeAIMove()
      : this.startTimer();
  }

  initSettingsPanel() {
    if (
      !this.settingsButton ||
      !this.settingsPanel ||
      !this.closeSettingsButton
    ) {
      console.error("Settings elements not found");
      return;
    }

    // 点击设置按钮显示面板
    this.settingsButton.addEventListener("click", () => {
      this.settingsPanel.classList.remove("hidden");
      setTimeout(() => {
        this.settingsPanel.classList.add("active");
      }, 10);
    });

    // 点击关闭按钮隐藏面板
    this.closeSettingsButton.addEventListener("click", () => {
      this.settingsPanel.classList.remove("active");
      setTimeout(() => {
        this.settingsPanel.classList.add("hidden");
      }, 300);
    });

    // 点击面板外部区域关闭面板
    this.settingsPanel.addEventListener("click", (e) => {
      if (e.target === this.settingsPanel) {
        this.settingsPanel.classList.remove("active");
        setTimeout(() => {
          this.settingsPanel.classList.add("hidden");
        }, 300);
      }
    });

    const soundToggle = document.getElementById("soundToggle");
    if (soundToggle) {
      // 初始化时根据本地存储设置开关状态
      const soundEnabled =
        localStorage.getItem("chessmin-sound-enabled") === "true";
      soundToggle.checked = soundEnabled;
      this.isSoundEnabled = soundEnabled;

      // 当用户切换开关时更新音效状态
      soundToggle.addEventListener("change", () => {
        this.isSoundEnabled = soundToggle.checked;
        localStorage.setItem("chessmin-sound-enabled", this.isSoundEnabled);
      });
    }
  }

  toggleSound(enabled) {
    // 保存音频状态到本地存储
    localStorage.setItem("chessmin-sound-enabled", enabled);

    // 更新音频状态标记
    this.isSoundEnabled = enabled;
  }
  startTimer() {
    this.clearTimer(); // 清除之前的计时器

    this.timeLeft = 40; // 重置时间
    this.updateTimerDisplay();

    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      this.updateTimerDisplay();

      if (this.timeLeft <= 0) {
        this.clearTimer();
        alert("请快点下棋。");
      }
    }, 1000);
  }

  //更新回合时长显示（40秒）
  updateTimerDisplay() {
    if (this.timerTurn) {
      this.timerTurn.textContent = ` ${this.timeLeft}`;
    }
  }

  clearTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  resetTime() {
    this.clearTimer();
    this.timeLeft = 40;
    this.updateTimerDisplay();
    this.totalTime.stop();
  }

  replay() {
    if (!this.eventListenersInitialized) {
      this.initEventListeners();
      this.eventListenersInitialized = true;
    }
    this.startGame();

    let bang = document.querySelector(".won");
    bang.style.animation = "start .6s ease-in-out";
    bang.style.top = "100%";
  }

  surrender() {
    this.isGameOver = true;
    this.surrenderButton.disabled = true;

    this.resetTime(); // 重置时间
    let bang = document.querySelector(".won");
    this.title1.textContent = "你输了！";
    this.endTime.textContent = this.totalTime.getFinalTime();
    bang.style.animation = "won .6s ease-in-out";
    bang.style.top = "30%";

    if (this.isSoundEnabled) {
      this.lose.play().catch((error) => {
        console.error("失败音效播放失败:", error);
      });
    }
  }

  async makeAIMove() {
    if (this.isGameOver) return;

    try {
      document.body.style.cursor = "wait";

      // 使用Promise来处理AI移动
      const makeMove = () => {
        return new Promise((resolve) => {
          const bestMove = this.ai.findBestMove();
          if (bestMove) {
            const result = this.game.makeMove(bestMove, this.game.PLAYER_A);
            resolve({ move: bestMove, ...result });
          } else {
            resolve(null);
          }
        });
      };

      const result = await makeMove();

      if (result && result.success) {
        this.ui.render();
        if (this.isSoundEnabled) {
          this.move.play().catch((error) => {
            console.error("移动音效播放失败:", error);
          });
        }

        if (result.capturedPosition) {
          this.ui.applyCaptureAnimation(result.capturedPosition);
          if (this.isSoundEnabled) {
            this.capture.play().catch((error) => {
              console.error("捕获音效播放失败:", error);
            });
          }
        }

        this.ui.showLastMove(result.move);
        const gameStatus = this.game.checkGameOver();
        if (gameStatus !== null) {
          this.endGame(gameStatus);
        } else {
          this.game.currentPlayer = this.game.PLAYER_B;
          this.ui.render();
          this.startTimer();
        }
      }
    } catch (error) {
      console.error("AI移动出错:", error);
    } finally {
      document.body.style.cursor = "default";
    }
  }

  endGame(status) {
    this.isGameOver = true;
    this.surrenderButton.disabled = true;

    this.resetTime();
    let bang = document.querySelector(".won");

    if (status === 0) {
      this.title1.textContent = "平局！";
    } else {
      this.title1.textContent =
        status === this.game.PLAYER_A ? "AI获胜！" : "玩家获胜！";
    }

    this.endTime.textContent = this.totalTime.getFinalTime();
    bang.style.animation = "won .6s ease-in-out";
    bang.style.top = "30%";

    // 播放音效
    if (this.isSoundEnabled && status !== 0) {
      if (status === this.game.PLAYER_B) {
        this.win.play().catch(
          (error) => {
            console.error("胜利音效播放失败:", error);
          },
          //胜利动画
          setTimeout(() => {
            confetti({
              particleCount: 200,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#ff5acd", "#fbda61", "#4158d0"],
            });
          }, 1000),
        );
      } else {
        this.lose.play().catch((error) => {
          console.error("失败音效播放失败:", error);
        });
      }
    }
  }

  handleCellClick(e) {
    // 如果游戏结束或不是玩家回合，则不处理点击
    if (this.isGameOver || this.game.currentPlayer === this.game.PLAYER_A) {
      return;
    }
    if (this.isSoundEnabled) {
      this.click.play().catch((error) => {
        console.error("点击音效播放失败:", error);
      });
    }
    const cell = e.target.closest(".cell");
    if (!cell) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const clickedPiece = this.game.board[row][col];

    // 处理玩家移动
    if (!this.selectedPiece) {
      if (clickedPiece === this.game.PLAYER_B) {
        this.selectedPiece = { row, col };
        this.validMoves = this.game
          .getValidMoves(this.game.PLAYER_B)
          .filter((move) => move.from[0] === row && move.from[1] === col);
        this.ui.clearHighlights();
        this.ui.highlightCell(row, col);
        this.ui.highlightValidMoves(this.validMoves);
      }
    } else {
      if (row === this.selectedPiece.row && col === this.selectedPiece.col) {
        this.selectedPiece = null;
        this.validMoves = [];
        this.ui.clearHighlights();
        return;
      }

      if (clickedPiece === this.game.PLAYER_B) {
        this.selectedPiece = { row, col };
        this.validMoves = this.game
          .getValidMoves(this.game.PLAYER_B)
          .filter((move) => move.from[0] === row && move.from[1] === col);
        this.ui.clearHighlights();
        this.ui.highlightCell(row, col);
        this.ui.highlightValidMoves(this.validMoves);

        return;
      }

      const move = {
        from: [this.selectedPiece.row, this.selectedPiece.col],
        to: [row, col],
      };

      // 检查是否是有效移动
      const isValidMove = this.validMoves.some(
        (validMove) =>
          validMove.to[0] === move.to[0] && validMove.to[1] === move.to[1],
      );

      if (!isValidMove) {
        alert("无效的移动！");
        // 清除选中状态
        this.selectedPiece = null;
        this.validMoves = [];
        this.ui.clearHighlights();
        return;
      }

      const result = this.game.makeMove(move, this.game.PLAYER_B);
      if (result.success) {
        this.clearTimer();
        this.game.currentPlayer = this.game.PLAYER_A;
        this.ui.render();
        if (this.isSoundEnabled) {
          this.move.play().catch((error) => {
            console.error("移动音效播放失败:", error);
          });
        }

        if (result.capturedPosition) {
          this.ui.applyCaptureAnimation(result.capturedPosition);
          if (this.isSoundEnabled) {
            this.capture.play().catch((error) => {
              console.error("捕获音效播放失败:", error);
            });
          }
        }
        const gameStatus = this.game.checkGameOver();
        if (gameStatus !== null) {
          this.endGame(gameStatus);
        } else {
          // 玩家移动成功后，启动AI移动
          setTimeout(() => this.makeAIMove(), 500);
        }
      }

      this.selectedPiece = null;
      this.validMoves = [];
      this.ui.clearHighlights();
    }
  }
}
