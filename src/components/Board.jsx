import React from 'react';
import { RED, BLACK } from '../constants';
import { staticFile } from 'remotion';

const Board = ({
    board,
    prevBoard,
    uci,
    frame = 0,
    durationInFrames = 45
}) => {
    const animationDuration = 20; // 20 frames of transition
    
    // Parse UCI coordinates using regex to support row 10 (e.g. h10g8)
    let lastMoveCoords = null;
    if (uci) {
        const match = uci.match(/^([a-i])([0-9]+)([a-i])([0-9]+)$/);
        if (match) {
            const c1 = match[1].charCodeAt(0) - 'a'.charCodeAt(0);
            const r1 = 10 - parseInt(match[2], 10);
            const c2 = match[3].charCodeAt(0) - 'a'.charCodeAt(0);
            const r2 = 10 - parseInt(match[4], 10);
            lastMoveCoords = { r1, c1, r2, c2 };
        }
    }

    const isAnimating = uci && frame < animationDuration && prevBoard;
    const activeBoard = board;

    const getPieceSvg = (color, type) => {
        const colorStr = color === RED ? 'red' : 'black';
        return staticFile(`assets/new-board/cn-${colorStr}-pieces-dark/cn-${colorStr}-${type}-dark.svg`);
    };

    const getPieceBg = (color) => {
        const colorStr = color === RED ? 'red' : 'black';
        return staticFile(`assets/new-board/new-board-images/${colorStr}-wooden-piece-bg.svg`);
    };

    return (
        <div className="w-full flex justify-center items-start mt-4">
            {/* Outer wooden border container */}
            <div 
                className="relative p-3 rounded-2xl shadow-xl border-[4px] border-[#a05c30]/35 select-none"
                style={{
                    backgroundImage: `url(${staticFile('assets/new-board/new-board-images/wooden-board-bg.svg')})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {/* Subtle double-line border overlay */}
                <div className="absolute inset-1.5 border border-[#a05c30]/10 pointer-events-none rounded-lg"></div>
                
                <div className="relative" style={{ width: 'min(90vw, 455px)', aspectRatio: '9/10' }}>
                    {/* SVG Board Lines Overlay */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 90 100" style={{ zIndex: 10 }}>
                        {/* Classic double-line border */}
                        <rect x="3.8" y="3.8" width="82.4" height="92.4" rx="2.0" ry="2.0" fill="none" stroke="#9c5324" strokeWidth="0.75" />
                        <rect x="5.0" y="5.0" width="80.0" height="90.0" fill="none" stroke="#9c5324" strokeWidth="0.25" />

                        {Array.from({ length: 10 }).map((_, i) => (
                            <line key={`h-${i}`} x1="5" y1={5 + i * 10} x2="85" y2={5 + i * 10} stroke="#9c5324" strokeWidth="0.25" />
                        ))}
                        {Array.from({ length: 9 }).map((_, i) => (
                            <React.Fragment key={`v-${i}`}>
                                <line x1={5 + i * 10} y1="5" x2={5 + i * 10} y2="45" stroke="#9c5324" strokeWidth="0.25" />
                                <line x1={5 + i * 10} y1="55" x2={5 + i * 10} y2="95" stroke="#9c5324" strokeWidth="0.25" />
                            </React.Fragment>
                        ))}
                        <line x1="5" y1="45" x2="5" y2="55" stroke="#9c5324" strokeWidth="0.25" />
                        <line x1="85" y1="45" x2="85" y2="55" stroke="#9c5324" strokeWidth="0.25" />
                        <line x1="35" y1="5" x2="55" y2="25" stroke="#9c5324" strokeWidth="0.25" />
                        <line x1="55" y1="5" x2="35" y2="25" stroke="#9c5324" strokeWidth="0.25" />
                        <line x1="35" y1="75" x2="55" y2="95" stroke="#9c5324" strokeWidth="0.25" />
                        <line x1="55" y1="75" x2="35" y2="95" stroke="#9c5324" strokeWidth="0.25" />
                        {[
                            [2, 1], [2, 7], [3, 0], [3, 2], [3, 4], [3, 6], [3, 8],
                            [7, 1], [7, 7], [6, 0], [6, 2], [6, 4], [6, 6], [6, 8]
                        ].map(([r, c], idx) => {
                            const x = 5 + c * 10;
                            const y = 5 + r * 10;
                            const offset = 0.8; const len = 1.8;
                            return (
                                <g key={`mark-${idx}`} stroke="#9c5324" strokeWidth="0.25" fill="none" opacity="0.85">
                                    {c > 0 && <path d={`M ${x - offset - len} ${y - offset} L ${x - offset} ${y - offset} L ${x - offset} ${y - offset - len}`} />}
                                    {c < 8 && <path d={`M ${x + offset + len} ${y - offset} L ${x + offset} ${y - offset} L ${x + offset} ${y - offset - len}`} />}
                                    {c > 0 && <path d={`M ${x - offset - len} ${y + offset} L ${x - offset} ${y + offset} L ${x - offset} ${y + offset + len}`} />}
                                    {c < 8 && <path d={`M ${x + offset + len} ${y + offset} L ${x + offset} ${y + offset} L ${x + offset} ${y + offset + len}`} />}
                                </g>
                            );
                        })}
                        {/* Calligraphy river names and website watermark */}
                        <text x="20" y="51" fontSize="6.5" fontFamily="KaiTi, 楷体, 'Microsoft YaHei', serif" fontWeight="bold" fill="#9c5324" textAnchor="middle" dominantBaseline="middle">楚 河</text>
                        <text x="45" y="51" fontSize="3.5" fontFamily="'Times New Roman', Georgia, serif" fontWeight="bold" fill="#9c5324" opacity="0.35" textAnchor="middle" dominantBaseline="middle">Xiangqi.com</text>
                        <text x="70" y="51" fontSize="6.5" fontFamily="KaiTi, 楷体, 'Microsoft YaHei', serif" fontWeight="bold" fill="#9c5324" textAnchor="middle" dominantBaseline="middle">漢 界</text>

                        {/* Coordinates (Black: left to right 1-9, Red: right to left 1-9) */}
                        {Array.from({ length: 9 }).map((_, i) => (
                            <React.Fragment key={`coords-${i}`}>
                                <text x={5 + i * 10} y="2" fontSize="2.8" fontFamily="Arial, sans-serif" fontWeight="bold" fill="#9c5324" opacity="0.75" textAnchor="middle" dominantBaseline="middle">{i + 1}</text>
                                <text x={85 - i * 10} y="98" fontSize="2.8" fontFamily="Arial, sans-serif" fontWeight="bold" fill="#9c5324" opacity="0.75" textAnchor="middle" dominantBaseline="middle">{i + 1}</text>
                            </React.Fragment>
                        ))}
                    </svg>

                    {/* Pieces Grid Overlay */}
                    <div 
                        className="absolute inset-0 grid" 
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            zIndex: 20,
                            gridTemplateRows: 'repeat(10, minmax(0, 1fr))',
                            gridTemplateColumns: 'repeat(9, minmax(0, 1fr))'
                        }}
                    >
                        {activeBoard.map((row, r) => (
                            row.map((piece, c) => {
                                const isSource = lastMoveCoords && lastMoveCoords.r1 === r && lastMoveCoords.c1 === c;
                                const isDest = lastMoveCoords && lastMoveCoords.r2 === r && lastMoveCoords.c2 === c;

                                return (
                                    <div key={`${r}-${c}`} className="relative flex justify-center items-center">
                                        {isSource && (
                                            <div className="absolute w-[94%] h-[94%] border-[1.5px] border-dashed border-[#1e88e5] bg-[#1e88e5]/15 z-10 rounded-md scale-95"></div>
                                        )}
                                        {isDest && (
                                            <div className="absolute w-[94%] h-[94%] border-[1.8px] border-solid border-[#1e88e5] bg-[#1e88e5]/25 z-10 rounded-md scale-95"></div>
                                        )}
                                        
                                        {piece && (
                                            (() => {
                                                const isRedChariotOrHorse = piece.color === RED && (piece.type === 'chariot' || piece.type === 'horse');
                                                const pieceSize = isRedChariotOrHorse ? '72%' : '64%';
                                                
                                                let transformStr = 'none';
                                                if (piece.color === BLACK && piece.type === 'elephant') {
                                                    transformStr = 'translateX(0.5px)';
                                                } else if (piece.color === BLACK && piece.type === 'cannon') {
                                                    transformStr = 'translateY(-0.5px)';
                                                }

                                                // Check if this cell contains the moving piece during translation
                                                const isMoving = isAnimating && isDest;
                                                let animatingStyle = {
                                                    transform: 'translate3d(0, 0, 0)',
                                                    willChange: 'transform'
                                                };
                                                if (isMoving) {
                                                    const p = Math.min(1, frame / animationDuration);
                                                    const easeProgress = 1 - Math.pow(1 - p, 3);
                                                    const dx = (lastMoveCoords.c1 - lastMoveCoords.c2) * (1 - easeProgress) * 100;
                                                    const dy = (lastMoveCoords.r1 - lastMoveCoords.r2) * (1 - easeProgress) * 100;
                                                    animatingStyle = {
                                                        transform: `translate3d(${dx}%, ${dy}%, 0)`,
                                                        willChange: 'transform'
                                                    };
                                                }

                                                return (
                                                    <div
                                                        className={`absolute inset-0 flex justify-center items-center ${isMoving ? 'z-30' : 'z-20'}`}
                                                        style={animatingStyle}
                                                    >
                                                        <div
                                                            className="relative flex justify-center items-center rounded-full"
                                                            style={{
                                                                width: '90%', height: '90%',
                                                                backgroundImage: `url(${getPieceBg(piece.color)})`,
                                                                backgroundSize: 'cover',
                                                                backgroundPosition: 'center',
                                                                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.45))'
                                                            }}
                                                        >
                                                             <img 
                                                                 src={getPieceSvg(piece.color, piece.type)} 
                                                                 alt={`${piece.color} ${piece.type}`} 
                                                                 style={{ 
                                                                     width: pieceSize, 
                                                                     height: pieceSize, 
                                                                     transform: transformStr,
                                                                     pointerEvents: 'none' 
                                                                 }}
                                                             />
                                                        </div>
                                                    </div>
                                                );
                                            })()
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
