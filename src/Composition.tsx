import { AbsoluteFill, Series, Audio, staticFile, useCurrentFrame, Sequence } from 'remotion';
import timeline from './video-timeline.json';
import Board from './components/Board';
import React from 'react';
import { mountainBase64 } from './mountain-base64';
import './index.css';
import './Composition.css'; 

const formatTitle = (title: string): string[] => {
    if (!title) return ["象棋兵法"];
    let clean = title.replace(/[（(](.*?)[）)]/g, '$1').trim();
    const isEnglish = /[a-zA-Z]/.test(clean);
    
    if (isEnglish) {
        const words = clean.split(/\s+/);
        const lines: string[] = [];
        let currentLine = "";
        
        for (const w of words) {
            if (currentLine.length + w.length + 1 > 28) {
                lines.push(currentLine);
                currentLine = w;
            } else {
                currentLine = currentLine ? `${currentLine} ${w}` : w;
            }
        }
        if (currentLine) lines.push(currentLine);
        
        if (lines.length > 3) {
            return [lines[0], lines[1], lines.slice(2).join(" ")];
        }
        return lines;
    } else {
        let match = clean.match(/^(\d+(?:\.\d+)*)\s*(.*)$/);
        if (match) {
            let num = match[1];
            let text = match[2];
            if (text.includes("对")) {
                let parts = text.split("对");
                return [num, parts[0].trim(), `对${parts.slice(1).join("对").trim()}`];
            }
            return [num, text];
        }
        if (clean.includes("对")) {
            let parts = clean.split("对");
            return [parts[0].trim(), `对${parts.slice(1).join("对").trim()}`];
        }
        return [clean];
    }
};

// Helper to wrap key Chinese chess terms and common vocabulary with non-breaking spans to prevent line-break splitting
const wrapChessTerms = (text: string): React.ReactNode => {
    if (!text) return "";
    
    // Comprehensive dictionary of Chinese chess terminology and key vocabulary
    const chessTerms = [
        "顺手炮", "顺手砲", "列手炮", "列手砲", "中炮", "中砲", "反宫马", "反宫馬", 
        "单提马", "单提馬", "屏风马", "屏风馬", "大列炮", "大列砲", "小列炮", "小列砲", 
        "后补列炮", "后补列砲", "象棋兵法", "直车", "直車", "横车", "横車", "中路", 
        "对称", "對稱", "阵形", "陣形", "阵势", "陣勢", "开局", "開局", "防守", 
        "进攻", "進攻", "红方", "紅方", "黑方", "楚河", "汉界", "漢界", "小列砲",
        "大列砲", "对称", "对称的", "反攻马", "反攻馬", "夹炮屏风", "夹砲屏风"
    ];
    
    // Sort by length descending to match longer terms first (e.g. 后补列炮 before 中炮)
    const sortedTerms = [...chessTerms].sort((a, b) => b.length - a.length);
    
    // Escape regex characters just in case
    const pattern = sortedTerms.map(term => term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${pattern})`, 'g');
    
    const parts = text.split(regex);
    return parts.map((part, idx) => {
        if (sortedTerms.includes(part)) {
            return (
                <span 
                    key={idx} 
                    style={{ 
                        whiteSpace: 'nowrap', 
                        display: 'inline-block' 
                    }}
                >
                    {part}
                </span>
            );
        }
        return part;
    });
};

interface SceneSequenceProps {
    scene: any;
}

// ------------------- HORIZONTAL COMPOSITION COMPONENTS -------------------
const SceneSequenceHorizontal: React.FC<SceneSequenceProps> = ({ scene }) => {
    const frame = useCurrentFrame();
    
    // Find active subtitle text dynamically
    let currentSubtitleText = "";
    let elapsed = scene.audioStartFrame || 0;
    
    for (const sub of scene.subtitles || []) {
        if (frame >= elapsed && frame < elapsed + sub.durationInFrames) {
            currentSubtitleText = sub.text;
            break;
        }
        elapsed += sub.durationInFrames;
    }
    
    const titleLines = formatTitle(scene.title || "象棋兵法");

    return (
        <AbsoluteFill>
            {/* Horizontal Header */}
            <div className="absolute top-10 right-14 text-right flex flex-col items-end z-20">
                <h1 
                    className={`font-bold text-[#8b1e1e] leading-[1.3] max-w-[320px] ${
                        /[a-zA-Z]/.test(scene.title || "") ? 'text-[14px]' : 'text-[20px]'
                    }`}
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                    {titleLines.map((line, lIdx) => (
                        <div key={lIdx}>{line}</div>
                    ))}
                </h1>
                <div className="w-[150px] h-[2px] bg-[#8b1e1e]/40 my-2"></div>
                <div className="text-[10px] font-semibold text-[#8b1e1e]/60 tracking-[0.25em] font-serif uppercase">
                    xiangqi.com official
                </div>
            </div>

            {/* Horizontal Board */}
            <div className="absolute inset-x-0 top-[25px] flex justify-center">
                <Board 
                    board={scene.board} 
                    prevBoard={scene.prevBoard}
                    uci={scene.uci}
                    frame={frame}
                    durationInFrames={scene.durationInFrames}
                />
            </div>

            {/* Horizontal Subtitles */}
            {currentSubtitleText && currentSubtitleText !== "..." ? (
                <div className="absolute bottom-[30px] left-0 right-0 flex justify-center z-30 pointer-events-none">
                    <div 
                        className="bg-black/70 rounded-[28px] border border-gray-800/40 shadow-2xl flex justify-center items-center"
                        style={{
                            maxWidth: '85%',
                            width: 'auto',
                            display: 'inline-flex',
                            padding: '10px 20px',
                        }}
                    >
                        <p 
                            className={`text-[#fff0a8] font-bold tracking-[0.08em] text-center leading-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
                                /[a-zA-Z]/.test(currentSubtitleText) ? 'text-[20px]' : 'text-[24px]'
                            }`}
                            style={{
                                wordBreak: 'break-word',
                                whiteSpace: 'normal'
                            }}
                        >
                            {currentSubtitleText}
                        </p>
                    </div>
                </div>
            ) : null}

            {/* Right Side Panel: Branch Variations */}
            {scene.branchInfo && scene.branchInfo.branches && (
                <div 
                    className="absolute top-[185px] right-14 w-[240px] rounded-2xl shadow-xl flex flex-col z-20 overflow-hidden"
                    style={{
                        backgroundColor: '#FCF8F2',
                        border: '2px solid #8b1e1e',
                        padding: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15)'
                    }}
                >
                    <div className="w-full h-full flex flex-col p-1.5 border border-dashed border-[#8b1e1e]/30 rounded-xl">
                        {(() => {
                            const originalBranches = [...scene.branchInfo.branches];
                            const reversedBranches = [...originalBranches].reverse();
                            const total = originalBranches.length;
                            
                            return reversedBranches.map((branchTextWithNumber: string, idx: number) => {
                                const match = branchTextWithNumber.match(/^(\d+)\.\s*(.*)$/);
                                const originalNumber = match ? parseInt(match[1], 10) : (total - idx);
                                const cleanMoveText = match ? match[2] : branchTextWithNumber;
                                
                                const displayIndex = idx + 1;
                                const isActive = scene.branchInfo.activeIndex === (originalNumber - 1);
                                
                                return (
                                    <div 
                                        key={idx} 
                                        className={`w-full py-3 px-4 text-left transition-all duration-300 font-serif ${
                                            isActive 
                                                ? 'bg-[#8b1e1e] text-[#fff0a8] font-bold text-[20px] rounded-xl shadow-md scale-[1.03] z-10' 
                                                : 'text-[#8b1e1e]/65 font-semibold text-[18px] border-b border-dashed border-[#8b1e1e]/15 last:border-b-0'
                                        }`}
                                    >
                                        {displayIndex}. {cleanMoveText}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}
        </AbsoluteFill>
    );
};

export const MyComposition: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: '#f6f1e5' }}>
            <div 
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${staticFile('assets/bg-light.png')})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.85,
                    pointerEvents: 'none'
                }}
            />

            <img 
                src={staticFile('assets/soldiers-light.png')} 
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: 'auto',
                    opacity: 0.8,
                    pointerEvents: 'none'
                }}
            />

            <div className="absolute top-10 left-14 flex items-center gap-3 z-20">
                <div 
                    className="w-10 h-10 rounded-full flex justify-center items-center"
                    style={{
                        backgroundImage: `url(${staticFile('assets/new-board/new-board-images/red-wooden-piece-bg.svg')})`,
                        backgroundSize: 'cover',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }}
                >
                    <img 
                        src={staticFile('assets/new-board/cn-red-pieces-dark/cn-red-elephant-dark.svg')} 
                        style={{ width: '70%', height: '70%', pointerEvents: 'none' }}
                    />
                </div>
                <span className="text-2xl font-extrabold text-[#8b1e1e] font-serif tracking-tight drop-shadow-sm">Xiangqi.com</span>
            </div>

            <Series>
                {timeline.map((scene, idx) => {
                    return (
                        <Series.Sequence key={idx} durationInFrames={scene.durationInFrames}>
                            <SceneSequenceHorizontal scene={scene} />
                            
                            {scene.audios && (scene.audios as any[]).map((audio, aIdx) => (
                                <Sequence key={aIdx} from={audio.startFrame} durationInFrames={audio.durationInFrames}>
                                    <Audio src={staticFile(audio.file.replace('/audio/', 'audio/'))} />
                                </Sequence>
                            ))}
                        </Series.Sequence>
                    );
                })}
            </Series>
        </AbsoluteFill>
    );
};

// ------------------- VERTICAL COMPOSITION COMPONENTS -------------------
const SceneSequenceVertical: React.FC<SceneSequenceProps> = ({ scene }) => {
    const frame = useCurrentFrame();
    
    // Find active subtitle text dynamically
    let currentSubtitleText = "";
    let elapsed = scene.audioStartFrame || 0;
    
    for (const sub of scene.subtitles || []) {
        if (frame >= elapsed && frame < elapsed + sub.durationInFrames) {
            currentSubtitleText = sub.text;
            break;
        }
        elapsed += sub.durationInFrames;
    }
    
    const titleLines = formatTitle(scene.title || "象棋兵法");

    return (
        <AbsoluteFill style={{ backgroundColor: '#f6f1e5' }}>
            {/* Mountain Background inside Scene to prevent overlay blocking */}
            <img 
                src={staticFile('assets/mountain_shortVideo.png')}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    pointerEvents: 'none',
                    zIndex: 1
                }}
            />

            {/* Blended Warrior Silhouette at the bottom */}
            <img 
                src={staticFile('assets/warrior_shortVideo.png')} 
                style={{
                    position: 'absolute',
                    bottom: '-100px',
                    left: 0,
                    width: '100%',
                    height: 'auto',
                    opacity: 0.25, 
                    pointerEvents: 'none',
                    zIndex: 2,
                    mixBlendMode: 'multiply'
                }}
            />

            {/* Vertical Header: Centered & Aligned Top Right matching client mockup */}
            <div className="absolute top-[100px] right-[70px] text-right flex flex-col items-end z-20">
                <h1 
                    className={`font-bold text-[#8b1e1e] leading-[1.3] max-w-[480px] ${
                        /[a-zA-Z]/.test(scene.title || "") ? 'text-[36px]' : 'text-[56px]'
                    }`}
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                    {titleLines.map((line, lIdx) => (
                        <div key={lIdx}>{line}</div>
                    ))}
                </h1>
                <div className="w-[240px] h-[3px] bg-[#8b1e1e]/40 my-3"></div>
                <div className="text-[16px] font-semibold text-[#8b1e1e]/60 tracking-[0.25em] font-serif uppercase">
                    xiangqi.com official
                </div>
            </div>

            {/* 1. Branch Info Display (1/4): Positioned at a fixed absolute top point */}
            {scene.branchInfo && scene.branchInfo.branches && (
                <div 
                    className="absolute inset-x-0 flex justify-center z-20"
                    style={{ 
                        top: '285px', // Moved down by 40px (from 245px to 285px)
                    }}
                >
                    <div 
                        className="text-center px-10 py-3 rounded-2xl border shadow-md font-bold transition-all duration-300"
                        style={{
                            width: '520px', // Fixed tight width
                            backgroundColor: '#FCF8F2',
                            borderColor: '#8b1e1e',
                            borderWidth: '2.5px',
                            color: '#8b1e1e',
                            fontSize: '32px',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            boxShadow: '0 6px 15px rgba(0,0,0,0.12)'
                        }}
                    >
                        变例 ({scene.branchInfo.branches.length - scene.branchInfo.activeIndex}/{scene.branchInfo.branches.length}): {
                            (() => {
                                const activeBranch = scene.branchInfo.branches[scene.branchInfo.activeIndex];
                                return activeBranch ? activeBranch.replace(/^\d+\.\s*/, '') : '';
                            })()
                        }
                    </div>
                </div>
            )}

            {/* 2. Chessboard Container: Positioned at a fixed absolute top point, shifted up by 40px (to 43.5% centered) */}
            <div 
                className="absolute inset-x-0 flex items-center justify-center z-10 w-full"
                style={{
                    top: '43.5%', // Centered absolute anchor
                    transform: 'translateY(-50%)',
                }}
            >
                <div style={{ transform: 'scale(1.75)', transformOrigin: 'center center' }}>
                    <Board 
                        board={scene.board} 
                        prevBoard={scene.prevBoard}
                        uci={scene.uci}
                        frame={frame}
                        durationInFrames={scene.durationInFrames}
                    />
                </div>
            </div>

            {/* 3. Subtitles Container: Positioned at a fixed absolute bottom position with text-wrap balance to avoid single trailing words */}
            {currentSubtitleText && currentSubtitleText !== "..." ? (
                <div 
                    style={{ 
                        position: 'absolute',
                        top: '1350px', // Moved down by 30px (from 1320px to 1350px)
                        left: 0,
                        right: 0,
                        pointerEvents: 'none',
                        zIndex: 30
                    }}
                    className="flex justify-center w-full"
                >
                    <div 
                        className="bg-black/70 rounded-[28px] border border-gray-800/40 shadow-2xl flex justify-center items-center"
                        style={{
                            width: '796px', // Match board width perfectly
                            display: 'inline-flex',
                            padding: '20px 40px',
                        }}
                    >
                        <p 
                            className={`text-[#fff0a8] font-bold tracking-[0.08em] text-center leading-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
                                /[a-zA-Z]/.test(currentSubtitleText) ? 'text-[32px]' : 'text-[42px]'
                            }`}
                            style={{
                                wordBreak: 'break-word',
                                whiteSpace: 'normal',
                                textWrap: 'balance', // Prevents single trailing characters on a new line
                            }}
                        >
                            {currentSubtitleText.split('\n').map((line, idx) => (
                                <React.Fragment key={idx}>
                                    {idx > 0 && <br />}
                                    {wrapChessTerms(line)}
                                </React.Fragment>
                            ))}
                        </p>
                    </div>
                </div>
            ) : null}
        </AbsoluteFill>
    );
};

export const MyCompositionVertical: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: '#f6f1e5' }}>
            {/* Left Top branding logo */}
            <div className="absolute top-[100px] left-[70px] flex items-center gap-5 z-20 scale-[1.4] origin-top-left">
                <div 
                    className="w-12 h-12 rounded-full flex justify-center items-center"
                    style={{
                        backgroundImage: `url(${staticFile('assets/new-board/new-board-images/red-wooden-piece-bg.svg')})`,
                        backgroundSize: 'cover',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }}
                >
                    <img 
                        src={staticFile('assets/new-board/cn-red-pieces-dark/cn-red-elephant-dark.svg')} 
                        style={{ width: '70%', height: '70%', pointerEvents: 'none' }}
                    />
                </div>
                <span className="text-3xl font-extrabold text-[#8b1e1e] font-serif tracking-tight drop-shadow-sm">Xiangqi.com</span>
            </div>

            <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                <Series>
                    {timeline.map((scene, idx) => {
                        return (
                            <Series.Sequence key={idx} durationInFrames={scene.durationInFrames}>
                                <SceneSequenceVertical scene={scene} />
                                
                                {/* Audio Tracks */}
                                {scene.audios && (scene.audios as any[]).map((audio, aIdx) => (
                                    <Sequence key={aIdx} from={audio.startFrame} durationInFrames={audio.durationInFrames}>
                                        <Audio src={staticFile(audio.file.replace('/audio/', 'audio/'))} />
                                    </Sequence>
                                ))}
                            </Series.Sequence>
                        );
                    })}
                </Series>
            </div>
        </AbsoluteFill>
    );
};
