import { ROWS, COLS, RED, BLACK, PIECES, FEN_MAP, CHAR_TO_PIECE } from '../constants.js';

// --- 常量 Helper ---
const RED_RIVER_ROW = 4;
const BLACK_RIVER_ROW = 5;

// --- 輔助函數：初始化棋盤 ---
export const createInitialBoard = () => {
    const board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

    const setupRow = (row, color, types) => {
        types.forEach((type, col) => {
            board[row][col] = { type, color };
        });
    };

    const backRow = [
        PIECES.CHARIOT, PIECES.HORSE, PIECES.ELEPHANT, PIECES.ADVISOR,
        PIECES.KING,
        PIECES.ADVISOR, PIECES.ELEPHANT, PIECES.HORSE, PIECES.CHARIOT
    ];

    // 黑方 (頂部, r=0)
    setupRow(0, BLACK, backRow);
    board[2][1] = { type: PIECES.CANNON, color: BLACK };
    board[2][7] = { type: PIECES.CANNON, color: BLACK };
    [0, 2, 4, 6, 8].forEach(col => board[3][col] = { type: PIECES.SOLDIER, color: BLACK });

    // 紅方 (底部, r=9)
    setupRow(9, RED, backRow);
    board[7][1] = { type: PIECES.CANNON, color: RED };
    board[7][7] = { type: PIECES.CANNON, color: RED };
    [0, 2, 4, 6, 8].forEach(col => board[6][col] = { type: PIECES.SOLDIER, color: RED });

    return board;
};

// --- 驗證邏輯 ---
export const countObstacles = (board, r1, c1, r2, c2) => {
    let count = 0;
    if (r1 === r2) { // Horizontal
        const min = Math.min(c1, c2);
        const max = Math.max(c1, c2);
        for (let c = min + 1; c < max; c++) if (board[r1][c]) count++;
    } else if (c1 === c2) { // Vertical
        const min = Math.min(r1, r2);
        const max = Math.max(r1, r2);
        for (let r = min + 1; r < max; r++) if (board[r][c1]) count++;
    }
    return count;
};

export const isValidMove = (board, r1, c1, r2, c2, color) => {
    // Basic bounds check
    if (r2 < 0 || r2 >= ROWS || c2 < 0 || c2 >= COLS) return false;

    // Check source piece
    const piece = board[r1][c1];
    if (!piece || piece.color !== color) return false; // Must move own piece

    // Check target occupation
    const target = board[r2][c2];
    if (target && target.color === color) return false; // Cannot capture own

    const dr = r2 - r1;
    const dc = c2 - c1;
    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);

    switch (piece.type) {
        case PIECES.KING:
            if (absDr + absDc !== 1) return false;
            if (c2 < 3 || c2 > 5) return false;
            if (color === RED && r2 < 7) return false;
            if (color === BLACK && r2 > 2) return false;
            return true;
        case PIECES.ADVISOR:
            if (absDr !== 1 || absDc !== 1) return false;
            if (c2 < 3 || c2 > 5) return false;
            if (color === RED && r2 < 7) return false;
            if (color === BLACK && r2 > 2) return false;
            return true;
        case PIECES.ELEPHANT:
            if (absDr !== 2 || absDc !== 2) return false;
            if (color === RED && r2 < 5) return false;
            if (color === BLACK && r2 > 4) return false;
            if (board[Math.floor((r1 + r2) / 2)][Math.floor((c1 + c2) / 2)]) return false;
            return true;
        case PIECES.HORSE:
            if (!((absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2))) return false;
            if (absDr === 2) {
                if (board[r1 + (dr > 0 ? 1 : -1)][c1]) return false;
            } else {
                if (board[r1][c1 + (dc > 0 ? 1 : -1)]) return false;
            }
            return true;
        case PIECES.CHARIOT:
            if (r1 !== r2 && c1 !== c2) return false;
            if (countObstacles(board, r1, c1, r2, c2) > 0) return false;
            return true;
        case PIECES.CANNON:
            if (r1 !== r2 && c1 !== c2) return false;
            const obstacles = countObstacles(board, r1, c1, r2, c2);
            if (!target) return obstacles === 0;
            else return obstacles === 1;
        case PIECES.SOLDIER:
            const forward = color === RED ? -1 : 1;
            const crossedRiver = color === RED ? r1 <= 4 : r1 >= 5;
            if (crossedRiver) {
                if (dr === -forward) return false;
                if (absDr + absDc !== 1) return false;
            } else {
                if (dc !== 0) return false;
                if (dr !== forward) return false;
            }
            return true;
        default: return false;
    }
};

// --- FEN Utils ---
export const generateFen = (board, turn) => {
    let fen = '';
    for (let r = 0; r < ROWS; r++) {
        let emptyCount = 0;
        for (let c = 0; c < COLS; c++) {
            const piece = board[r][c];
            if (piece) {
                if (emptyCount > 0) {
                    fen += emptyCount;
                    emptyCount = 0;
                }
                const char = FEN_MAP[piece.type];
                fen += piece.color === RED ? char.toUpperCase() : char.toLowerCase();
            } else {
                emptyCount++;
            }
        }
        if (emptyCount > 0) fen += emptyCount;
        if (r < ROWS - 1) fen += '/';
    }
    fen += ` ${turn === RED ? 'w' : 'b'}`;
    fen += ' - - 0 1';
    return fen;
};

export const parseFen = (fenString) => {
    const parts = fenString.trim().split(/\s+/);
    const boardPart = parts[0];
    const turnPart = parts[1];

    const rows = boardPart.split('/');
    if (rows.length !== ROWS) throw new Error(`Invalid row count: ${rows.length}`);

    const newBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

    rows.forEach((rowStr, r) => {
        let c = 0;
        for (let i = 0; i < rowStr.length; i++) {
            const char = rowStr[i];
            if (/\d/.test(char)) {
                c += parseInt(char, 10);
            } else {
                const lowerChar = char.toLowerCase();
                const type = CHAR_TO_PIECE[lowerChar];
                const color = char === char.toUpperCase() ? RED : BLACK;
                if (type && c < COLS) {
                    newBoard[r][c] = { type, color };
                    c++;
                }
            }
        }
    });

    return {
        board: newBoard,
        turn: turnPart === 'b' ? BLACK : RED
    };
};

export const cloneBoard = (board) => board.map(r => r.map(c => c ? { ...c } : null));

export const getPieceValue = (pieceType, color, row) => {
    // This value logic was originally inside BotLogic, but it's useful to have here if needed
    // Assuming simple mapping, but BotLogic has 'p_cr' logic (crossed river pawn).
    // I will duplicate that logic here for completeness as a utility? 
    // Or just keep it in BotLogic?
    // Let's keep a basic version or just let BotLogic define it.
    // BotLogic defines it specifically for evaluation.
    return 0; // Placeholder if not used generally
};
