import { ROWS, COLS } from '../constants.js';

// 將內部坐標轉換為 UCI 字符串 (例如: 0,0 -> a9, 9,8 -> i0)
// 注意：UCCI 規範中，紅方底線為 rank 0，黑方底線為 rank 9。
// 左邊(紅方視角)為 file a，右邊為 file i。
export const toUcciCoord = (r, c) => {
    const colChar = String.fromCharCode('a'.charCodeAt(0) + c); // 0->a, 1->b...
    const rowChar = String(9 - r); // 0(top)->9, 9(bottom)->0
    return `${colChar}${rowChar}`;
};

export const toUcciMove = (r1, c1, r2, c2) => {
    return `${toUcciCoord(r1, c1)}${toUcciCoord(r2, c2)}`;
};

export const uciToCoords = (uci) => {
    const c1 = uci.charCodeAt(0) - 'a'.charCodeAt(0);
    const r1 = 9 - (parseInt(uci[1]));
    const c2 = uci.charCodeAt(2) - 'a'.charCodeAt(0);
    const r2 = 9 - (parseInt(uci[3]));
    return { r1, c1, r2, c2 };
};
