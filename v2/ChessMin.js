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
  //初始化
  lose = new Audio(this.soundFiles[0]);
  move = new Audio(this.soundFiles[1]);
  win = new Audio(this.soundFiles[2]);
  click = new Audio(this.soundFiles[3]);
  capture = new Audio(this.soundFiles[4]);

  // audioElements = this.soundFiles.map(file => new Audio(file));

  constructor() {
    this.initializeGame();
    this.isSoundEnabled = true;
    localStorage.setItem("chessmin-sound-enabled", "true");

    this.boardElement = document.querySelector(".board");
    this.replayElement = document.querySelector(".replay");
    this.surrenderButton = document.getElementById("surrender");
    this.settingsButton = document.getElementById("settings");
    this.settingsPanel = document.querySelector(".settings-panel");
    this.closeSettingsButton = document.getElementById("closeSettings");

    this.start = document.querySelector(".floating");
    this.start.addEventListener("click", () => {
      let init = document.querySelector(".init");
      init.style.animation = "start .5s ease-in";
      init.style.top = "100%";
      this.startNewGame();
    });

    this.ui.render();
  }

  initEventListeners() {
    if (this.boardElement) {
      this.boardElement.addEventListener(
        "click",
        this.handleCellClick.bind(this),
      );
    }
    if (this.startElement) {
      this.startElement.addEventListener("click", () => this.start());
    }
    if (this.replayElement) {
      this.replayElement.addEventListener("click", () => this.replay());
    }
    if (this.surrenderButton) {
      this.surrenderButton.addEventListener("click", this.surrender.bind(this));
    }
    //设置面板监听
    this.initSettingsPanel();
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

    // 主题切换功能
    const themeButtons = document.querySelectorAll(".theme-btn");
    themeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const theme = btn.dataset.theme;
        this.changeTheme(theme);
      });
    });

    // 棋子样式切换功能
    const pieceStyleButtons = document.querySelectorAll(".piece-style-btn");
    pieceStyleButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const style = btn.dataset.style;
        this.changePieceStyle(style);
      });
    });
    const colorInput = document.querySelector(
      'input[type="color"].piece-style-btn',
    );
    colorInput.addEventListener("input", (event) => {
      event.target.style.backgroundColor = event.target.value;
      this.changePieceStyle(event.target.value);
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

  changeTheme(theme) {
    document.body.className = theme;
    localStorage.setItem("chessmin-theme", theme);
  }

  changePieceStyle(style) {
    let color;

    switch (style) {
      case "black":
        color = "black";
        break;
      case "green":
        color = "green";
        break;
      case "lightblue":
        color = "lightblue";
        break;
      default:
        color = style; // Assume custom color
        break;
    }

    document.documentElement.style.setProperty("--piece-bg-color", color);
    localStorage.setItem("chessmin-piece-style", style);
  }

  toggleSound(enabled) {
    // 保存音频状态到本地存储
    localStorage.setItem("chessmin-sound-enabled", enabled);

    // 更新音频状态标记
    this.isSoundEnabled = enabled;
  }

  initializeGame() {
    this.game = new ChessGame();
    this.ui = new GameUI(this.game);
    this.ai = new ChessAI02(this.game, 2000);
    this.selectedPiece = null;
    this.lastMove = null;
    this.isGameOver = false;
    this.timer = null;
    this.timeLeft = 40;
    this.gameStartTime = null;
    this.totalGameTime = 0;
  }

  startNewGame() {
    this.initializeGame();
    this.ui.render();
    this.isSoundEnabled = false;
    this.surrenderButton.disabled = false;

    this.clearTimer();
    this.timeLeft = 40; // 重置时间
    this.updateTimerDisplay(); // 更新显示为初始时间

    this.gameStartTime = Date.now(); // 重新开始时重置计时
    this.totalGameTime = 0;
    this.totalElement = document.getElementById("total-time");
    this.title1 = document.querySelector(".title1");
    this.endTime = document.querySelector(".end-time");
    this.totalTime = new Timer(this.totalElement);
    this.timerElement = document.querySelector(".timer");
    this.totalTime.start();

    this.initEventListeners();

    if (this.game.currentPlayer === this.game.PLAYER_A) {
      this.makeAIMove();
    } else if (this.game.currentPlayer === this.game.PLAYER_B) {
      this.startTimer();
    }
  }

  formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}分${seconds}秒`;
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

  updateTimerDisplay() {
    if (this.timerElement) {
      this.timerElement.textContent = ` ${this.timeLeft}`;
    }
  }

  clearTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  replay() {
    // 重置计时器和游戏时间
    this.totalGame = document.querySelector(".total-time");
    this.totalTime = new Timer(this.totalGame);

    // 确保计时器被正确启动
    this.clearTimer();
    this.timeLeft = 40; // 重置时间
    this.updateTimerDisplay();

    // 确保所有UI元素被正确重置
    this.ui.render();

    // 确保事件监听器不会重复绑定
    if (!this.eventListenersInitialized) {
      this.initEventListeners();
      this.eventListenersInitialized = true;
    }

    // 重置游戏状态
    this.selectedPiece = null;
    this.lastMove = null;
    this.isGameOver = false;
    this.startNewGame();

    // document.querySelector('.hidden').classList.add('levelUp');
    let bang = document.querySelector(".won");

    bang.style.animation = "start .6s ease-in-out";
    bang.style.top = "100%";
  }

  // start() {
  //     this.startNewGame();
  // }

  surrender() {
    this.isGameOver = true;

    this.surrenderButton.disabled = true;
    this.clearTimer();
    this.timeLeft = 40;
    this.updateTimerDisplay();
    this.totalTime.stop();
    if (this.gameStartTime) {
      this.totalGameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
    }
    // this.totalGameTimeElement.textContent = this.formatTime(this.totalGameTime);
    let bang = document.querySelector(".won");
    this.title1.textContent = "你输了！";
    this.endTime.textContent = this.formatTime(this.totalGameTime);
    bang.style.animation = "won .6s ease-in-out";
    bang.style.top = "30%";
    if (this.isSoundEnabled) {
      this.lose.play().catch((error) => {
        console.error("失败音效播放失败:", error);
      });

      // setTimeout(() => {
      //     confetti({
      //         particleCount: 200,
      //         spread: 70,
      //         origin: { y: 0.6 },
      //         colors: ['#ff5acd', '#fbda61', '#4158d0']
      //     });
      // }, 1000);

      // let message = `游戏结束：玩家(黑方)投降！ (总时长: ${this.formatTime(this.totalGameTime)})`;
      // setTimeout(() => alert(message), 100);
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
            // resolve(result);
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

        // this.recordMove(
        //     this.game.PLAYER_A,
        //     result.move,
        //     result.capturedPosition,
        // );

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
    this.clearTimer();
    this.timeLeft = 40; // 重置时间
    this.updateTimerDisplay(); // 更新显示为初始时间
    this.totalTime.stop();

    if (this.gameStartTime) {
      this.totalGameTime = Math.floor((Date.now() - this.gameStartTime) / 1000); // 转换为秒
    }

    // const gameResult = {
    //   status:
    //     status === 0
    //       ? "平局"
    //       : status === this.game.PLAYER_A
    //         ? "AI获胜"
    //         : "玩家获胜",
    //   totalTime: this.formatTime(this.totalGameTime),
    //   totalMoves: this.totalMoves,
    //   gameLog: this.gameLog,
    //   timestamp: new Date().toISOString(),
    // };

    // let message;
    if (status === 0) {
      // message = `游戏结束：平局 (总时长: ${this.formatTime(this.totalGameTime)})`;
      let bang = document.querySelector(".won");
      this.title1.textContent = "平局！";
      bang.style.animation = "won .6s ease-in-out";
      bang.style.top = "30%";
    } else {
      // message = `游戏结束：${status === this.game.PLAYER_A ? "AI(红方)" : "玩家(黑方)"}获胜！ (总时长: ${this.formatTime(this.totalGameTime)})`;
      let bang = document.querySelector(".won");
      this.title1.textContent =
        status === this.game.PLAYER_A ? "AI获胜！" : "玩家获胜！";
      this.endTime.textContent = this.formatTime(this.totalGameTime);
      bang.style.animation = "won .6s ease-in-out";
      bang.style.top = "30%";
    }
    //如果是游戏结束状态，那么不可以发起投降
    if (status) {
      this.surrenderButton.disabled = true;
    }

    // 播放音效
    if (status !== 0 && this.isSoundEnabled) {
      if (status === this.game.PLAYER_B) {
        this.win.play().catch((error) => {
          console.error("胜利音效播放失败:", error);
        });
      } else {
        this.lose.play().catch((error) => {
          console.error("失败音效播放失败:", error);
        });
      }
    }
    // 如果赢了，放烟花效果
    if (status !== 0 && status === this.game.PLAYER_B) {
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#ff5acd", "#fbda61", "#4158d0"],
        });
      }, 1000);
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
        // console.log("当前玩家变更为:", this.game.currentPlayer);

        if (result.capturedPosition) {
          this.ui.applyCaptureAnimation(result.capturedPosition);
          if (this.isSoundEnabled) {
            this.capture.play().catch((error) => {
              console.error("捕获音效播放失败:", error);
            });
          }
        }

        // this.recordMove(this.game.PLAYER_B, move, result.capturedPosition);

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