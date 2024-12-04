class ChessGame {
  constructor() {
    this.BOARD_SIZE = 5;
    this.PLAYER_A = 1; // A方
    this.PLAYER_B = -1; // B方
    this.EMPTY = 0;
    this.DIRECTIONS = Object.freeze([
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ]); // 上右下左
    this.board = this.initializeBoard();
    this.currentPlayer = this.PLAYER_B; // B方先手
    this.selectedPiece = null;
    this.lastMove = null;
    this.moveHistory = [];
    this.playerAPieces = 7;
    this.playerBPieces = 7;
  }

  // 初始化棋盘
  initializeBoard() {
    const board = Array(this.BOARD_SIZE)
      .fill(0)
      .map(() => Array(this.BOARD_SIZE).fill(0));

    // 转换位置编号到行列
    const posToCoord = (pos) => {
      const row = Math.floor((pos - 1) / 5);
      const col = (pos - 1) % 5;
      return [row, col];
    };

    // 设置玩家A的初始位置 (1-5, 6, 8, 10)
    [1, 2, 4, 5, 6, 8, 10].forEach((pos) => {
      const [row, col] = posToCoord(pos);
      board[row][col] = this.PLAYER_A;
    });

    // 设置玩家B的初始位置 (21-25, 16, 18, 20)
    [21, 22, 24, 25, 16, 18, 20].forEach((pos) => {
      const [row, col] = posToCoord(pos);
      board[row][col] = this.PLAYER_B;
    });

    return board;
  }

  // 获取有效移动
  getValidMoves(player) {
    const moves = [];
    for (let row = 0; row < this.BOARD_SIZE; row++) {
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        if (this.board[row][col] === player) {
          // 检查四个方向
          for (const [dx, dy] of this.DIRECTIONS) {
            const newRow = row + dx;
            const newCol = col + dy;
            if (
              this.isValidPosition(newRow, newCol) &&
              this.board[newRow][newCol] === this.EMPTY
            ) {
              moves.push({
                from: [row, col],
                to: [newRow, newCol],
              });
            }
          }
        }
      }
    }
    // 输出所有合法移动
    // console.log(`玩家 ${player} 的所有合法移动:`, moves);
    return moves;
  }

  // 检查位置是否在棋盘内
  isValidPosition(row, col) {
    return (
      row >= 0 && row < this.BOARD_SIZE && col >= 0 && col < this.BOARD_SIZE
    );
  }

  // 验证移动的有效性
  isValidMove(move, player) {
    const [fromRow, fromCol] = move.from;
    const [toRow, toCol] = move.to;

    // 检查起始位置是否是玩家的棋子
    if (this.board[fromRow][fromCol] !== player) {
      return false;
    }

    // 检查目标位置是否为空
    if (this.board[toRow][toCol] !== this.EMPTY) {
      return false;
    }

    // 检查是否是相邻位置
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  // 执行移动并返回是否吃子
  makeMove(move, player) {
    const [fromRow, fromCol] = move.from;
    const [toRow, toCol] = move.to;

    if (
      this.currentPlayer === this.PLAYER_B &&
      !this.isValidMove(move, player)
    ) {
      // console.log("无效的移动！");
      return { success: false, captured: false };
    }

    this.board[toRow][toCol] = player;
    this.board[fromRow][fromCol] = this.EMPTY;
    this.lastMove = move;

    // console.log("移动执行完毕。检查是否可以吃子...");
    const capturedPos = this.checkAndCapture({ to: [toRow, toCol] }, player);
    if (capturedPos) {
      // console.log(`吃子发生在 (${capturedPos[0]},${capturedPos[1]})`);
      if (player === this.PLAYER_A) {
        this.playerBPieces--;
        // console.log(`玩家B的棋子减少到 ${this.playerBPieces}`);
      } else {
        this.playerAPieces--;
        // console.log(`玩家A的棋子减少到 ${this.playerAPieces}`);
      }
    } else {
      // console.log("没有发生吃子");
    }

    //记录移动历史
    const moveRecord = {
      player: player,
      move: move,
      captured: capturedPos !== null,
      capturedPosition: capturedPos,
    };
    this.moveHistory.push(moveRecord);
    // console.log("新添加的历史记录:", moveRecord);

    return {
      success: true,
      captured: capturedPos !== null,
      capturedPosition: capturedPos,
    };
  }

  // 检查是否吃子
  checkAndCapture(move, player) {
    const [row, col] = move.to;
    const opponent = -player;
    const directions = [
      [0, 1],
      [1, 0],
    ]; // 横向和纵向

    for (const [dx, dy] of directions) {
      // 获取当前行或列的所有位置
      const line = [];
      // 对于5*5的棋盘，收集该行或该列的所有棋子状态
      for (let i = 0; i < 5; i++) {
        const checkRow = dx === 0 ? row : i;
        const checkCol = dy === 0 ? col : i;
        if (this.isValidPosition(checkRow, checkCol)) {
          line.push({
            value: this.board[checkRow][checkCol],
            position: [checkRow, checkCol],
          });
        }
      }

      // 定义可能的吃子模式
      const patterns = [
        ["current", "current", "opponent", "empty", "empty"],
        ["empty", "current", "current", "opponent", "empty"],
        ["opponent", "current", "current", "empty", "empty"],
        ["empty", "opponent", "current", "current", "empty"],
        ["empty", "empty", "current", "current", "opponent"],
        ["empty", "empty", "opponent", "current", "current"],
      ];

      // 检查是否匹配任何一种吃子模式
      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        let capturePos = null;
        let matches = true;

        // 检查5个连续位置是否匹配模式
        for (let j = 0; j < 5; j++) {
          const expectedValue =
            pattern[j] === "current"
              ? player
              : pattern[j] === "opponent"
                ? opponent
                : this.EMPTY;

          if (line[j].value !== expectedValue) {
            matches = false;
            break;
          }

          // 记录对手棋子的位置
          if (pattern[j] === "opponent") {
            capturePos = line[j].position;
          }
        }

        // 如果找到匹配的模式
        if (matches && capturePos) {
          // console.log(`在${dx === 0 ? '横向' : '纵向'}找到吃子模式，吃掉位置(${capturePos[0]},${capturePos[1]})的棋子`);
          this.board[capturePos[0]][capturePos[1]] = this.EMPTY;
          return capturePos;
        }
      }
    }

    return null;
  }

  // 检查游戏是否结束
  checkGameOver() {
    if (this.playerAPieces <= 1) return this.PLAYER_B; // A方胜
    if (this.playerBPieces <= 1) return this.PLAYER_A; // B方胜

    // 检查是否有可移动的位置
    if (this.getValidMoves(this.PLAYER_A).length === 0) return this.PLAYER_B;
    if (this.getValidMoves(this.PLAYER_B).length === 0) return this.PLAYER_A;

    // 检查是否陷入僵局
    if (
      this.getValidMoves(this.PLAYER_A).length === 0 &&
      this.getValidMoves(this.PLAYER_B).length === 0
    ) {
      return 0; // 平局
    }

    return null; // 游戏继续
  }
}

export default ChessGame;
