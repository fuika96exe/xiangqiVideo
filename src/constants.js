export const ROWS = 10;
export const COLS = 9;

export const RED = 'red';
export const BLACK = 'black';

// 棋子類型
export const PIECES = {
    KING: 'king',     // 帥/將
    ADVISOR: 'advisor', // 仕/士
    ELEPHANT: 'elephant', // 相/象
    HORSE: 'horse',   // 傌/馬
    CHARIOT: 'chariot', // 俥/車
    CANNON: 'cannon', // 炮/包
    SOLDIER: 'soldier', // 兵/卒
};

// FEN 字符映射
export const FEN_MAP = {
    [PIECES.KING]: 'k',
    [PIECES.ADVISOR]: 'a',
    [PIECES.ELEPHANT]: 'b',
    [PIECES.HORSE]: 'n',
    [PIECES.CHARIOT]: 'r',
    [PIECES.CANNON]: 'c',
    [PIECES.SOLDIER]: 'p',
};

// 反向映射 (char -> piece type)
export const CHAR_TO_PIECE = Object.entries(FEN_MAP).reduce((acc, [type, char]) => {
    acc[char] = type;
    return acc;
}, {});

// 棋子顯示文字
export const PIECE_TEXT = {
    [RED]: {
        [PIECES.KING]: '帥',
        [PIECES.ADVISOR]: '仕',
        [PIECES.ELEPHANT]: '相',
        [PIECES.HORSE]: '傌',
        [PIECES.CHARIOT]: '俥',
        [PIECES.CANNON]: '炮',
        [PIECES.SOLDIER]: '兵',
    },
    [BLACK]: {
        [PIECES.KING]: '將',
        [PIECES.ADVISOR]: '士',
        [PIECES.ELEPHANT]: '象',
        [PIECES.HORSE]: '馬',
        [PIECES.CHARIOT]: '車',
        [PIECES.CANNON]: '包',
        [PIECES.SOLDIER]: '卒',
    },
};

export const INITIAL_ENGINE_SETTINGS = {
    depth: 20,
    movetime: 1000,
    skillLevel: 20,
    multiPV: 1,
};
