//迭代加深(Iterative Deepening)和 Alpha-Beta 剪枝
export default class ChessAI02 {
  constructor(game, timeLimit = 2000) {
    if (!game) {
      throw new Error("Game instance is required");
    }
    this.game = game;
    this.timeLimit = timeLimit;
    this.startTime = 0;
    this.bestMoveFound = null;

    // 棋盘位置权重
    this.positionWeights = [
      [3, 4, 5, 4, 3],
      [4, 6, 7, 6, 4],
      [5, 7, 8, 7, 5],
      [4, 6, 7, 6, 4],
      [3, 4, 5, 4, 3],
    ];
  }
  // 检查是否超时
  isTimeUp() {
    return Date.now() - this.startTime >= this.timeLimit;
  }

  // 处理游戏移动的撤销
  undoMove() {
    if (!this.game.moveHistory || this.game.moveHistory.length === 0) return;

    const lastMoveRecord = this.game.moveHistory.pop();
    if (!lastMoveRecord) return;

    try {
      const { move, player, captured, capturedPosition } = lastMoveRecord;
      if (!move || !move.from || !move.to) return;

      const { from, to } = move;

      // 恢复移动的棋子
      this.game.board[from[0]][from[1]] = player;
      this.game.board[to[0]][to[1]] = this.game.EMPTY;

      // 如果发生了吃子，恢复被吃的棋子
      if (captured && capturedPosition) {
        this.game.board[capturedPosition[0]][capturedPosition[1]] =
          player === this.game.PLAYER_A
            ? this.game.PLAYER_B
            : this.game.PLAYER_A;
        if (player === this.game.PLAYER_A) {
          this.game.playerBPieces++;
        } else {
          this.game.playerAPieces++;
        }
      }
    } catch (error) {
      console.error("Error in undoMove:", error);
    }
  }

  evaluateBoardState() {
    try {
      let score = 0;

      // 计算棋子数量差值
      const pieceDifference =
        (this.game.playerAPieces - this.game.playerBPieces) * 100;
      score += pieceDifference;

      // 评估位置
      for (let row = 0; row < this.game.BOARD_SIZE; row++) {
        for (let col = 0; col < this.game.BOARD_SIZE; col++) {
          const piece = this.game.board[row][col];
          if (piece === this.game.PLAYER_A) {
            score += this.positionWeights[row][col] * 10;
          } else if (piece === this.game.PLAYER_B) {
            score -= this.positionWeights[row][col] * 10;
          }
        }
      }

      // 评估机动性
      const aiMoves = this.game.getValidMoves(this.game.PLAYER_A).length;
      const playerMoves = this.game.getValidMoves(this.game.PLAYER_B).length;
      score += (aiMoves - playerMoves) * 5;

      // 中心控制评估
      score += this.evaluateCenterControl() * 15;

      // 吃子潜力评估
      score += this.evaluateCapturePotential() * 20;

      return score;
    } catch (error) {
      console.error("Error in evaluateBoardState:", error);
      return 0;
    }
  }

  evaluateCenterControl() {
    try {
      const centerSquares = [
        [1, 1],
        [1, 2],
        [1, 3],
        [2, 1],
        [2, 2],
        [2, 3],
        [3, 1],
        [3, 2],
        [3, 3],
      ];

      let controlScore = 0;
      for (const [row, col] of centerSquares) {
        if (this.game.board[row][col] === this.game.PLAYER_A) {
          controlScore += 1;
        } else if (this.game.board[row][col] === this.game.PLAYER_B) {
          controlScore -= 1;
        }
      }
      return controlScore;
    } catch (error) {
      console.error("Error in evaluateCenterControl:", error);
      return 0;
    }
  }

  evaluateCapturePotential() {
    try {
      let potentialScore = 0;
      const moves = this.game.getValidMoves(this.game.PLAYER_A);

      for (const move of moves) {
        if (!move || !move.from || !move.to) continue;

        // 临时执行移动
        const result = this.game.makeMove(move, this.game.PLAYER_A);

        if (result && result.success) {
          // 检查是否有吃子机会
          if (result.capturedPosition) {
            potentialScore += 1;
          }
          this.undoMove();
        }
      }
      return potentialScore;
    } catch (error) {
      console.error("Error in evaluateCapturePotential:", error);
      return 0;
    }
  }

  alphaBeta(depth, alpha, beta, maximizingPlayer) {
    try {
      if (this.isTimeUp()) {
        return this.evaluateBoardState();
      }

      const winner = this.game.checkGameOver();
      if (winner !== null) {
        return winner === this.game.PLAYER_A ? 10000 : -10000;
      }

      if (depth === 0) {
        return this.evaluateBoardState();
      }

      const currentPlayer = maximizingPlayer
        ? this.game.PLAYER_A
        : this.game.PLAYER_B;
      const validMoves = this.game.getValidMoves(currentPlayer);

      if (!validMoves || validMoves.length === 0) {
        return maximizingPlayer ? -10000 : 10000;
      }

      // 移动排序
      validMoves.sort((a, b) => {
        const scoreA = this.getMoveScore(a);
        const scoreB = this.getMoveScore(b);
        return scoreB - scoreA;
      });

      if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of validMoves) {
          if (!move || !move.from || !move.to) continue;

          const result = this.game.makeMove(move, currentPlayer);
          if (result && result.success) {
            const evalValue = this.alphaBeta(depth - 1, alpha, beta, false);
            this.undoMove();

            if (this.isTimeUp()) return maxEval;

            maxEval = Math.max(maxEval, evalValue);
            alpha = Math.max(alpha, evalValue);
            if (beta <= alpha) break;
          }
        }
        return maxEval;
      } else {
        let minEval = Infinity;
        for (const move of validMoves) {
          if (!move || !move.from || !move.to) continue;

          const result = this.game.makeMove(move, currentPlayer);
          if (result && result.success) {
            const evalValue = this.alphaBeta(depth - 1, alpha, beta, true);
            this.undoMove();

            if (this.isTimeUp()) return minEval;

            minEval = Math.min(minEval, evalValue);
            beta = Math.min(beta, evalValue);
            if (beta <= alpha) break;
          }
        }
        return minEval;
      }
    } catch (error) {
      console.error("Error in alphaBeta:", error);
      return maximizingPlayer ? -Infinity : Infinity;
    }
  }

  getMoveScore(move) {
    try {
      if (!move || !move.to) return 0;

      let score = 0;
      const { to } = move;

      // 评估目标位置的权重
      if (
        this.positionWeights[to[0]] &&
        this.positionWeights[to[0]][to[1]] !== undefined
      ) {
        score += this.positionWeights[to[0]][to[1]] * 10;
      }

      // 如果是吃子移动给予更高分数
      if (this.game.isCapture && this.game.isCapture(move)) {
        score += 1000;
      }

      return score;
    } catch (error) {
      console.error("Error in getMoveScore:", error);
      return 0;
    }
  }

  iterativeDeepening() {
    try {
      this.startTime = Date.now();
      this.bestMoveFound = null;
      let depth = 1;

      // 获取所有有效移动
      const validMoves = this.game.getValidMoves(this.game.PLAYER_A);
      if (!validMoves || validMoves.length === 0) {
        console.log("No valid moves available");
        return null;
      }

      // 如果只有一个可能的移动，直接返回
      if (validMoves.length === 1) {
        console.log("Only one move available");
        return validMoves[0];
      }

      while (!this.isTimeUp()) {
        let bestEval = -Infinity;
        let bestMove = null;

        // 移动排序
        validMoves.sort((a, b) => {
          const scoreA = this.getMoveScore(a);
          const scoreB = this.getMoveScore(b);
          return scoreB - scoreA;
        });

        for (const move of validMoves) {
          if (!move || !move.from || !move.to) continue;

          const result = this.game.makeMove(move, this.game.PLAYER_A);
          if (result && result.success) {
            const evalValue = this.alphaBeta(
              depth - 1,
              -Infinity,
              Infinity,
              false,
            );
            this.undoMove();

            if (this.isTimeUp()) break;

            if (evalValue > bestEval) {
              bestEval = evalValue;
              bestMove = move;
            }
          }
        }

        if (!this.isTimeUp()) {
          this.bestMoveFound = bestMove;
          // console.log(`完成深度 ${depth} 的搜索`);
          depth++;
        }
      }

      // const thinkingTime = Date.now() - this.startTime;
      // console.log(`AI思考时间: ${thinkingTime}ms, 达到最大深度: ${depth - 1}`);

      return this.bestMoveFound;
    } catch (error) {
      console.error("Error in iterativeDeepening:", error);
      // 发生错误时返回第一个有效移动作为后备方案
      return this.game.getValidMoves(this.game.PLAYER_A)[0];
    }
  }
  findBestMove() {
    try {
      return this.iterativeDeepening();
    } catch (error) {
      console.error("Error in findBestMove:", error);
      // 出错时返回第一个有效移动
      const validMoves = this.game.getValidMoves(this.game.PLAYER_A);
      return validMoves && validMoves.length > 0 ? validMoves[0] : null;
    }
  }
}
