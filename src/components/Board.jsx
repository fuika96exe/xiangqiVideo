import React from 'react';
import { PIECES, RED, BLACK, PIECE_TEXT } from '../constants';
import { isValidMove } from '../utils/boardUtils';

const Board = ({
    board,
    turn,
    selected,
    onCellClick,
    moveHistory,
    viewIndex,
    winner,
    vsComputerMode,
    userSide,
    jumpToMove
}) => {
    const handlePrev = () => {
        if (viewIndex === -1) {
            if (moveHistory.length > 0) jumpToMove(moveHistory.length - 1);
            else jumpToMove(-2);
        } else if (viewIndex > 0) {
            jumpToMove(viewIndex - 1);
        } else if (viewIndex === 0) {
            jumpToMove(-2);
        }
    };

    const handleNext = () => {
        if (viewIndex === -2) {
            if (moveHistory.length > 0) jumpToMove(0);
            else jumpToMove(-1);
        } else if (viewIndex >= 0 && viewIndex < moveHistory.length - 1) {
            jumpToMove(viewIndex + 1);
        } else if (viewIndex === moveHistory.length - 1) {
            jumpToMove(-1);
        }
    };

    return (
        <div className="w-full flex justify-center items-start mt-4">
            <div className="relative p-1 md:p-3 bg-[#eecfa1] rounded shadow-2xl border-4 border-[#8b5a2b] select-none">
                <div className="absolute inset-2 border-2 border-[#8b5a2b] pointer-events-none opacity-50"></div>
                <div className="relative" style={{ width: 'min(90vw, 450px)', aspectRatio: '9/10' }}>
                    {/* SVG 棋盤繪製 */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 90 100">
                        <defs>
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 10 10 M 0 10 L 10 10" fill="none" stroke="#8b5a2b" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="#eecfa1" />
                        {Array.from({ length: 10 }).map((_, i) => (
                            <line key={`h-${i}`} x1="5" y1={5 + i * 10} x2="85" y2={5 + i * 10} stroke="#8b5a2b" strokeWidth="0.6" />
                        ))}
                        {Array.from({ length: 9 }).map((_, i) => (
                            <React.Fragment key={`v-${i}`}>
                                <line x1={5 + i * 10} y1="5" x2={5 + i * 10} y2="45" stroke="#8b5a2b" strokeWidth="0.6" />
                                <line x1={5 + i * 10} y1="55" x2={5 + i * 10} y2="95" stroke="#8b5a2b" strokeWidth="0.6" />
                            </React.Fragment>
                        ))}
                        <line x1="5" y1="45" x2="5" y2="55" stroke="#8b5a2b" strokeWidth="0.6" />
                        <line x1="85" y1="45" x2="85" y2="55" stroke="#8b5a2b" strokeWidth="0.6" />
                        <line x1="35" y1="5" x2="55" y2="25" stroke="#8b5a2b" strokeWidth="0.6" />
                        <line x1="55" y1="5" x2="35" y2="25" stroke="#8b5a2b" strokeWidth="0.6" />
                        <line x1="35" y1="75" x2="55" y2="95" stroke="#8b5a2b" strokeWidth="0.6" />
                        <line x1="55" y1="75" x2="35" y2="95" stroke="#8b5a2b" strokeWidth="0.6" />
                        {[
                            [2, 1], [2, 7], [3, 0], [3, 2], [3, 4], [3, 6], [3, 8],
                            [7, 1], [7, 7], [6, 0], [6, 2], [6, 4], [6, 6], [6, 8]
                        ].map(([r, c], idx) => {
                            const x = 5 + c * 10;
                            const y = 5 + r * 10;
                            const offset = 1; const len = 3;
                            return (
                                <g key={`mark-${idx}`} stroke="#8b5a2b" strokeWidth="0.6" fill="none">
                                    {c > 0 && <path d={`M ${x - offset - len} ${y - offset} L ${x - offset} ${y - offset} L ${x - offset} ${y - offset - len}`} />}
                                    {c < 8 && <path d={`M ${x + offset + len} ${y - offset} L ${x + offset} ${y - offset} L ${x + offset} ${y - offset - len}`} />}
                                    {c > 0 && <path d={`M ${x - offset - len} ${y + offset} L ${x - offset} ${y + offset} L ${x - offset} ${y + offset + len}`} />}
                                    {c < 8 && <path d={`M ${x + offset + len} ${y + offset} L ${x + offset} ${y + offset} L ${x + offset} ${y + offset + len}`} />}
                                </g>
                            );
                        })}
                        <text x="25" y="52" fontSize="6" fontFamily="KaiTi, serif" fill="#8b5a2b" textAnchor="middle" dominantBaseline="middle" style={{ writingMode: 'horizontal-tb' }}>楚 河</text>
                        <text x="65" y="52" fontSize="6" fontFamily="KaiTi, serif" fill="#8b5a2b" textAnchor="middle" dominantBaseline="middle" style={{ writingMode: 'horizontal-tb' }}>漢 界</text>
                    </svg>

                    {/* 棋子渲染層 */}
                    <div className="absolute inset-0 grid grid-rows-10 grid-cols-9" style={{ width: '100%', height: '100%' }}>
                        {board.map((row, r) => (
                            row.map((piece, c) => {
                                const isSelected = selected && selected.r === r && selected.c === c;
                                const isPossibleMove = selected && piece === null && isValidMove(board, selected.r, selected.c, r, c, board[selected.r][selected.c].color);
                                const isTarget = selected && piece && piece.color !== turn && isValidMove(board, selected.r, selected.c, r, c, board[selected.r][selected.c].color);

                                // Highlight Last Move
                                // Calculate last move based on viewIndex/moveHistory
                                let lastMoveCoords = null;
                                const lastMoveIdx = viewIndex === -1 ? moveHistory.length - 1 : viewIndex;

                                if (lastMoveIdx >= 0 && lastMoveIdx < moveHistory.length) {
                                    const m = moveHistory[lastMoveIdx];
                                    const c1 = m.charCodeAt(0) - 'a'.charCodeAt(0);
                                    const r1 = 9 - parseInt(m[1]);
                                    const c2 = m.charCodeAt(2) - 'a'.charCodeAt(0);
                                    const r2 = 9 - parseInt(m[3]);
                                    lastMoveCoords = { r1, c1, r2, c2 };
                                }

                                const isLastMoveFrom = lastMoveCoords && lastMoveCoords.r1 === r && lastMoveCoords.c1 === c;
                                const isLastMoveTo = lastMoveCoords && lastMoveCoords.r2 === r && lastMoveCoords.c2 === c;

                                return (
                                    <div key={`${r}-${c}`} onClick={() => onCellClick(r, c)} className="relative flex justify-center items-center cursor-pointer">
                                        {(isLastMoveFrom || isLastMoveTo) && <div className="absolute inset-0 bg-blue-400 opacity-40 z-0"></div>}
                                        {isPossibleMove && <div className="absolute w-3 h-3 bg-green-500 rounded-full opacity-50 z-10"></div>}
                                        {isTarget && <div className="absolute w-full h-full border-2 border-red-500 rounded-full opacity-60 z-0 scale-75"></div>}
                                        {piece && (
                                            <div
                                                className={`
                                                    relative z-20 flex justify-center items-center rounded-full shadow-[2px_2px_4px_rgba(0,0,0,0.4)]
                                                    ${isSelected ? 'scale-110 ring-2 ring-yellow-400 -translate-y-1 shadow-[4px_4px_8px_rgba(0,0,0,0.5)]' : ''}
                                                    ${piece.color === RED ? 'bg-[#f0d0b0] text-red-700 border-red-800' : 'bg-[#f0d0b0] text-black border-black'}
                                                `}
                                                style={{
                                                    width: '85%', height: '85%', borderWidth: '2px',
                                                    background: 'radial-gradient(circle at 30% 30%, #fff0e0, #e0c0a0)',
                                                    boxShadow: isSelected ? 'inset 0 0 10px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.3)' : 'inset 0 0 5px rgba(0,0,0,0.1), 1px 1px 3px rgba(0,0,0,0.4)'
                                                }}
                                            >
                                                <div className={`absolute inset-1 rounded-full border ${piece.color === RED ? 'border-red-700/30' : 'border-black/30'}`}></div>
                                                <span className="font-bold font-serif text-[clamp(12px,4vw,28px)] leading-none select-none" style={{ fontFamily: '"KaiTi", "楷體", serif' }}>
                                                    {PIECE_TEXT[piece.color][piece.type]}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Board;
