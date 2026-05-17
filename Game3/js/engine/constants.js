export const COLOR = {
  RED: 'red',
  BLACK: 'black'
};

export const PIECE_TYPE = {
  KING: 'king',
  ADVISOR: 'advisor',
  ELEPHANT: 'elephant',
  KNIGHT: 'knight',
  ROOK: 'rook',
  CANNON: 'cannon',
  PAWN: 'pawn'
};

export const PIECE_NAME = {
  [COLOR.RED]: {
    [PIECE_TYPE.KING]: '帅',
    [PIECE_TYPE.ADVISOR]: '仕',
    [PIECE_TYPE.ELEPHANT]: '相',
    [PIECE_TYPE.KNIGHT]: '馬',
    [PIECE_TYPE.ROOK]: '俥',
    [PIECE_TYPE.CANNON]: '炮',
    [PIECE_TYPE.PAWN]: '兵'
  },
  [COLOR.BLACK]: {
    [PIECE_TYPE.KING]: '将',
    [PIECE_TYPE.ADVISOR]: '士',
    [PIECE_TYPE.ELEPHANT]: '象',
    [PIECE_TYPE.KNIGHT]: '馬',
    [PIECE_TYPE.ROOK]: '車',
    [PIECE_TYPE.CANNON]: '砲',
    [PIECE_TYPE.PAWN]: '卒'
  }
};

export const PIECE_VALUE = {
  [PIECE_TYPE.KING]: 10000,
  [PIECE_TYPE.ROOK]: 900,
  [PIECE_TYPE.KNIGHT]: 450,
  [PIECE_TYPE.CANNON]: 450,
  [PIECE_TYPE.ADVISOR]: 200,
  [PIECE_TYPE.ELEPHANT]: 200,
  [PIECE_TYPE.PAWN]: 100
};

export const INITIAL_BOARD = [
  [
    { type: PIECE_TYPE.ROOK, color: COLOR.BLACK },
    { type: PIECE_TYPE.KNIGHT, color: COLOR.BLACK },
    { type: PIECE_TYPE.ELEPHANT, color: COLOR.BLACK },
    { type: PIECE_TYPE.ADVISOR, color: COLOR.BLACK },
    { type: PIECE_TYPE.KING, color: COLOR.BLACK },
    { type: PIECE_TYPE.ADVISOR, color: COLOR.BLACK },
    { type: PIECE_TYPE.ELEPHANT, color: COLOR.BLACK },
    { type: PIECE_TYPE.KNIGHT, color: COLOR.BLACK },
    { type: PIECE_TYPE.ROOK, color: COLOR.BLACK }
  ],
  [null, null, null, null, null, null, null, null, null],
  [null, { type: PIECE_TYPE.CANNON, color: COLOR.BLACK }, null, null, null, null, null, { type: PIECE_TYPE.CANNON, color: COLOR.BLACK }, null],
  [
    { type: PIECE_TYPE.PAWN, color: COLOR.BLACK },
    null,
    { type: PIECE_TYPE.PAWN, color: COLOR.BLACK },
    null,
    { type: PIECE_TYPE.PAWN, color: COLOR.BLACK },
    null,
    { type: PIECE_TYPE.PAWN, color: COLOR.BLACK },
    null,
    { type: PIECE_TYPE.PAWN, color: COLOR.BLACK }
  ],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [
    { type: PIECE_TYPE.PAWN, color: COLOR.RED },
    null,
    { type: PIECE_TYPE.PAWN, color: COLOR.RED },
    null,
    { type: PIECE_TYPE.PAWN, color: COLOR.RED },
    null,
    { type: PIECE_TYPE.PAWN, color: COLOR.RED },
    null,
    { type: PIECE_TYPE.PAWN, color: COLOR.RED }
  ],
  [null, { type: PIECE_TYPE.CANNON, color: COLOR.RED }, null, null, null, null, null, { type: PIECE_TYPE.CANNON, color: COLOR.RED }, null],
  [null, null, null, null, null, null, null, null, null],
  [
    { type: PIECE_TYPE.ROOK, color: COLOR.RED },
    { type: PIECE_TYPE.KNIGHT, color: COLOR.RED },
    { type: PIECE_TYPE.ELEPHANT, color: COLOR.RED },
    { type: PIECE_TYPE.ADVISOR, color: COLOR.RED },
    { type: PIECE_TYPE.KING, color: COLOR.RED },
    { type: PIECE_TYPE.ADVISOR, color: COLOR.RED },
    { type: PIECE_TYPE.ELEPHANT, color: COLOR.RED },
    { type: PIECE_TYPE.KNIGHT, color: COLOR.RED },
    { type: PIECE_TYPE.ROOK, color: COLOR.RED }
  ]
];

export const BOARD_ROWS = 10;
export const BOARD_COLS = 9;

/** 机动性价值：每多一个合法走法获得的评分加成 */
export const MOBILITY_VALUE = 5;

export function oppositeColor(color) {
  return color === COLOR.RED ? COLOR.BLACK : COLOR.RED;
}

export const RIVER_ROW_BLACK = 4;
export const RIVER_ROW_RED = 5;

export const POSITION_VALUE = {
  [PIECE_TYPE.ROOK]: [
    [14, 14, 12, 18, 16, 18, 12, 14, 14],
    [16, 20, 18, 24, 26, 24, 18, 20, 16],
    [12, 12, 12, 18, 18, 18, 12, 12, 12],
    [12, 18, 16, 22, 22, 22, 16, 18, 12],
    [12, 14, 12, 18, 18, 18, 12, 14, 12],
    [12, 16, 14, 20, 20, 20, 14, 16, 12],
    [6, 10, 8, 14, 14, 14, 8, 10, 6],
    [4, 8, 6, 14, 12, 14, 6, 8, 4],
    [8, 4, 8, 16, 8, 16, 8, 4, 8],
    [-2, 10, 6, 14, 12, 14, 6, 10, -2]
  ],
  [PIECE_TYPE.KNIGHT]: [
    [4, 8, 14, 12, 10, 12, 14, 8, 4],
    [6, 12, 14, 16, 16, 16, 14, 12, 6],
    [10, 14, 16, 18, 20, 18, 16, 14, 10],
    [8, 10, 16, 20, 18, 20, 16, 10, 8],
    [6, 10, 14, 18, 20, 18, 14, 10, 6],
    [6, 10, 12, 18, 18, 18, 12, 10, 6],
    [4, 8, 14, 14, 14, 14, 14, 8, 4],
    [2, 6, 10, 12, 12, 12, 10, 6, 2],
    [2, 4, 8, 8, 10, 8, 8, 4, 2],
    [0, 2, 4, 8, 6, 8, 4, 2, 0]
  ],
  [PIECE_TYPE.CANNON]: [
    [6, 4, 0, -10, -12, -10, 0, 4, 6],
    [2, 2, 0, -4, -14, -4, 0, 2, 2],
    [2, 2, 0, -10, -8, -10, 0, 2, 2],
    [0, 0, -2, 4, 10, 4, -2, 0, 0],
    [0, 0, 0, 2, 8, 2, 0, 0, 0],
    [-2, 0, 4, 2, 6, 2, 4, 0, -2],
    [0, 0, 0, 2, 4, 2, 0, 0, 0],
    [4, 0, 8, 6, 10, 6, 8, 0, 4],
    [0, 2, 4, 6, 6, 6, 4, 2, 0],
    [0, 0, 2, 6, 6, 6, 2, 0, 0]
  ],
  [PIECE_TYPE.PAWN]: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, -2, 0, 4, 0, -2, 0, 0],
    [2, 0, 8, 0, 8, 0, 8, 0, 2],
    [6, 12, 18, 18, 20, 18, 18, 12, 6],
    [10, 20, 30, 34, 40, 34, 30, 20, 10],
    [14, 26, 42, 60, 80, 60, 42, 26, 14],
    [18, 36, 56, 80, 120, 80, 56, 36, 18],
    [0, 3, 6, 9, 12, 9, 6, 3, 0]
  ],

  [PIECE_TYPE.KING]: [
    [0, 0, 0, 1, 2, 1, 0, 0, 0],
    [0, 0, 0, 2, 4, 2, 0, 0, 0],
    [0, 0, 0, 1, 3, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 3, 1, 0, 0, 0],
    [0, 0, 0, 2, 4, 2, 0, 0, 0],
    [0, 0, 0, 1, 2, 1, 0, 0, 0]
  ],

  [PIECE_TYPE.ADVISOR]: [
    [0, 0, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 3, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 3, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 1, 0, 0, 0]
  ],

  [PIECE_TYPE.ELEPHANT]: [
    [0, 0, 2, 0, 0, 0, 2, 0, 0],
    [0, 0, 0, 0, 3, 0, 0, 0, 0],
    [2, 0, 4, 0, 0, 0, 4, 0, 2],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 3, 0, 0, 5, 0, 0, 3, 0],
    [0, 3, 0, 0, 5, 0, 0, 3, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [2, 0, 4, 0, 0, 0, 4, 0, 2],
    [0, 0, 0, 0, 3, 0, 0, 0, 0],
    [0, 0, 2, 0, 0, 0, 2, 0, 0]
  ]
};
