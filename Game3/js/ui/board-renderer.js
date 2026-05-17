import { PIECE_NAME, BOARD_ROWS, BOARD_COLS } from '../engine/constants.js';

export class BoardRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`容器元素 #${containerId} 不存在`);
    }
    // 创建 canvas 元素
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = 'auto';
    // 棋盘宽高比 9:10 (9列:10行)
    this.canvas.style.aspectRatio = '9 / 10';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    // 内部状态
    this._selectedPos = null;     // {row, col} | null
    this._legalMoves = [];        // [{toRow, toCol, captured, ...}]
    this._checkPos = null;        // {row, col} | null
    this._flipped = false;        // 棋盘上下翻转
    this._lastMoveTo = null;      // {row, col} | null

    // 布局参数（render时计算）
    this._cellSize = 0;
    this._originX = 0;
    this._originY = 0;

    // 保存最后一次传入的 boardState，ResizeObserver 清空画布后自动重绘
    this._lastBoardState = null;

    // ResizeObserver 监听容器尺寸变化
    this._resizeObserver = new ResizeObserver(() => {
      this._onResize();
      // canvas.width 被设置后会清空画布，需重绘
      if (this._cellSize > 0 && this._lastBoardState) {
        this.render(this._lastBoardState);
      }
    });
    this._resizeObserver.observe(this.container);
    this._onResize();

    // 公开 getter，供 InputController 绑定事件
    // boardEl 兼容旧接口，canvasEl 是推荐的新接口
    Object.defineProperty(this, 'boardEl', {
      get: () => this.canvas,
      set: () => {},
      configurable: true
    });
  }

  get canvasEl() { return this.canvas; }

  _onResize() {
    const dpr = window.devicePixelRatio || 1;
    // 使用 canvas 自身的 CSS 宽度，而非容器的（容器含 padding）
    const cssW = this.canvas.clientWidth;
    if (cssW <= 0) return;
    const cssH = cssW * (10 / 9);  // 9:10 宽高比
    this.canvas.width = cssW * dpr;
    this.canvas.height = cssH * dpr;
    this.canvas.style.height = cssH + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 计算棋盘布局
    // 棋盘有 9列 x 10行交叉点，格子间距: 水平8格 x 垂直9格
    this._cellSize = Math.min(cssW / BOARD_COLS, cssH / BOARD_ROWS);
    this._originX = (cssW - this._cellSize * (BOARD_COLS - 1)) / 2;
    this._originY = (cssH - this._cellSize * (BOARD_ROWS - 1)) / 2;
  }

  render(boardState) {
    this._lastBoardState = boardState;

    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;

    // 清空
    ctx.clearRect(0, 0, w, h);

    // 如果布局尚未初始化（如容器刚由隐藏变可见），自动重算
    if (this._cellSize <= 0) {
      this._onResize();
    }
    if (this._cellSize <= 0) return;

    this._drawBoard(ctx, w, h);
    this._drawLastMoveIndicator(ctx);
    this._drawPieces(ctx, boardState);
    this._drawHighlights(ctx);
  }

  _drawBoard(ctx, w, h) {
    const cell = this._cellSize;
    const ox = this._originX;
    const oy = this._originY;
    const cols = BOARD_COLS;
    const rows = BOARD_ROWS;

    // 1. 木纹背景
    ctx.fillStyle = '#f0d9b5';
    ctx.fillRect(0, 0, w, h);

    // 棋盘外边框阴影
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#3d2b1f';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      ox - cell * 0.3, oy - cell * 0.3,
      cell * (cols - 1) + cell * 0.6,
      cell * (rows - 1) + cell * 0.6
    );
    ctx.restore();

    // 2. 内边框
    ctx.strokeStyle = '#3d2b1f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ox, oy, cell * (cols - 1), cell * (rows - 1));

    // 3. 横线（10条）
    for (let r = 0; r < rows; r++) {
      ctx.beginPath();
      ctx.moveTo(ox, oy + r * cell);
      ctx.lineTo(ox + (cols - 1) * cell, oy + r * cell);
      ctx.stroke();
    }

    // 4. 竖线（列）- 河界处断开
    for (let c = 0; c < cols; c++) {
      ctx.beginPath();
      ctx.moveTo(ox + c * cell, oy);
      ctx.lineTo(ox + c * cell, oy + 4 * cell);  // 上到河界上
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ox + c * cell, oy + 5 * cell);  // 河界下
      ctx.lineTo(ox + c * cell, oy + (rows - 1) * cell);  // 下到底
      ctx.stroke();
    }
    // 河界上下边线
    ctx.beginPath();
    ctx.moveTo(ox, oy + 4 * cell);
    ctx.lineTo(ox + (cols - 1) * cell, oy + 4 * cell);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ox, oy + 5 * cell);
    ctx.lineTo(ox + (cols - 1) * cell, oy + 5 * cell);
    ctx.stroke();

    // 5. 九宫斜线
    ctx.beginPath();
    ctx.moveTo(ox + 3 * cell, oy); ctx.lineTo(ox + 5 * cell, oy + 2 * cell);
    ctx.moveTo(ox + 5 * cell, oy); ctx.lineTo(ox + 3 * cell, oy + 2 * cell);
    ctx.moveTo(ox + 3 * cell, oy + 7 * cell); ctx.lineTo(ox + 5 * cell, oy + 9 * cell);
    ctx.moveTo(ox + 5 * cell, oy + 7 * cell); ctx.lineTo(ox + 3 * cell, oy + 9 * cell);
    ctx.stroke();

    // 6. 楚河汉界
    ctx.save();
    ctx.font = `bold ${cell * 0.4}px KaiTi, STKaiti, SimSun, serif`;
    ctx.fillStyle = '#3d2b1f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const riverY = oy + 4.5 * cell;
    ctx.fillText('楚  河', ox + 2 * cell, riverY);
    ctx.fillText('汉  界', ox + 6 * cell, riverY);
    ctx.restore();
  }

  _drawPieces(ctx, boardState) {
    const cell = this._cellSize;
    const ox = this._originX;
    const oy = this._originY;

    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const piece = boardState.getPiece(row, col);
        if (!piece) continue;

        const x = ox + col * cell;
        const y = oy + this._adjustRow(row) * cell;
        const radius = cell * 0.42;
        const isSelected = this._selectedPos && this._selectedPos.row === row && this._selectedPos.col === col;
        const isCheck = this._checkPos && this._checkPos.row === row && this._checkPos.col === col;

        this._drawPiece(ctx, x, y, radius, piece, isSelected, isCheck);
      }
    }
  }

  _drawPiece(ctx, x, y, radius, piece, isSelected, isCheck) {
    const isRed = piece.color === 'red';

    ctx.save();

    // 选中外发光
    if (isSelected) {
      ctx.shadowColor = 'rgba(255, 215, 0, 0.7)';
      ctx.shadowBlur = 14;
    }

    // 棋子阴影
    if (!isSelected) {
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 2;
    }

    // 径向渐变底
    const gradient = ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.3, radius * 0.1,
      x, y, radius
    );

    if (isRed) {
      gradient.addColorStop(0, '#fdebd0');
      gradient.addColorStop(1, '#d4a574');
      ctx.strokeStyle = '#c0392b';
    } else {
      gradient.addColorStop(0, '#888');
      gradient.addColorStop(1, '#333');
      ctx.strokeStyle = '#1a1a1a';
    }

    // 圆形底
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();

    // 内圈装饰
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.85, 0, Math.PI * 2);
    ctx.strokeStyle = isRed ? 'rgba(192,57,43,0.3)' : 'rgba(26,26,46,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 文字
    ctx.fillStyle = isRed ? '#c0392b' : '#1a1a1a';
    ctx.font = `bold ${radius * 0.9}px KaiTi, STKaiti, SimSun, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const name = PIECE_NAME[piece.color][piece.type];
    ctx.fillText(name, x, y + 1);

    ctx.restore();

    // 将军效果：红色外发光（静态版本，不脉冲）
    if (isCheck) {
      ctx.save();
      ctx.shadowColor = 'rgba(220, 50, 50, 0.7)';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = 'rgba(220, 50, 50, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawHighlights(ctx) {
    const cell = this._cellSize;
    const ox = this._originX;
    const oy = this._originY;

    for (const move of this._legalMoves) {
      const x = ox + move.toCol * cell;
      const y = oy + this._adjustRow(move.toRow) * cell;
      const isCapture = !!move.captured;

      ctx.save();
      if (isCapture) {
        // 吃子标记：红色圆环
        ctx.strokeStyle = 'rgba(220, 50, 50, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, cell * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // 合法走法：绿色半透明圆点
        ctx.fillStyle = 'rgba(0, 180, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, cell * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawLastMoveIndicator(ctx) {
    if (!this._lastMoveTo) return;

    const cell = this._cellSize;
    const ox = this._originX;
    const oy = this._originY;
    const row = this._adjustRow(this._lastMoveTo.row);
    const col = this._lastMoveTo.col;

    const x = ox + col * cell;
    const y = oy + row * cell;
    const pad = cell * 0.05;

    ctx.save();
    ctx.fillStyle = 'rgba(173, 216, 230, 0.4)';
    ctx.fillRect(x - cell / 2 + pad, y - cell / 2 + pad, cell - pad * 2, cell - pad * 2);
    ctx.restore();
  }

  // ---- 接口方法 ----

  setSelected(row, col) {
    if (row == null || col == null) {
      this._selectedPos = null;
      return;
    }
    this._selectedPos = { row, col };
  }

  clearSelected() {
    this._selectedPos = null;
  }

  setCheckHighlight(row, col) {
    if (row == null || col == null) {
      this._checkPos = null;
      return;
    }
    this._checkPos = { row, col };
  }

  clearCheckHighlight() {
    this._checkPos = null;
  }

  getCellElement(row, col) {
    // 不再需要 DOM cell，返回 null 兼容旧接口
    return null;
  }

  getPositionFromElement(element) {
    // 不再需要，返回 null
    return null;
  }

  _adjustRow(row) {
    return this._flipped ? BOARD_ROWS - 1 - row : row;
  }

  setFlipped(flipped) {
    this._flipped = flipped;
  }

  setLastMoveTo(row, col) {
    if (row == null || col == null) {
      this._lastMoveTo = null;
      return;
    }
    this._lastMoveTo = { row, col };
  }

  clearLastMoveTo() {
    this._lastMoveTo = null;
  }

  // 坐标映射：从像素坐标到棋盘行列
  pixelToBoard(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const scaleX = (this.canvas.width / dpr) / rect.width;
    const scaleY = (this.canvas.height / dpr) / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const col = Math.round((x - this._originX) / this._cellSize);
    let row = Math.round((y - this._originY) / this._cellSize);
    if (this._flipped) row = BOARD_ROWS - 1 - row;

    if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return null;
    return { row, col };
  }
}
