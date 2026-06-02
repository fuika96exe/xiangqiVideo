import { AbsoluteFill, Series, Audio, staticFile, useCurrentFrame } from 'remotion';
import timeline from './video-timeline.json';
import Board from './components/Board';
import React from 'react';
import './index.css';
import './Composition.css'; 

const formatTitle = (title: string): [string, string] => {
    if (!title) return ["象棋兵法", ""];
    let clean = title.replace(/[（(](.*?)[）)]/g, '$1');
    let match = clean.match(/^(\d+(?:\.\d+)*)\s*(.*)$/);
    if (match) {
        let num = match[1];
        let text = match[2];
        if (text.includes("对")) {
            let parts = text.split("对");
            return [`${num} ${parts[0].trim()}`, `对${parts.slice(1).join("对").trim()}`];
        }
        return [`${num} ${text}`, ""];
    }
    if (clean.includes("对")) {
        let parts = clean.split("对");
        return [parts[0].trim(), `对${parts.slice(1).join("对").trim()}`];
    }
    return [clean, ""];
};

const SceneSequence: React.FC<{ scene: any }> = ({ scene }) => {
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
    
    const [titleLine1, titleLine2] = formatTitle(scene.title || "象棋兵法");

    return (
        <AbsoluteFill>
            {/* Right Top Header: Premium chapter styling */}
            <div className="absolute top-10 right-14 text-right flex flex-col items-end z-20">
                <h1 
                    className="text-[20px] font-bold text-[#8b1e1e] leading-[1.3] max-w-[500px]"
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                    <div>{titleLine1}</div>
                    {titleLine2 ? <div>{titleLine2}</div> : null}
                </h1>
                <div className="w-[150px] h-[2px] bg-[#8b1e1e]/40 my-2"></div>
                <div className="text-[10px] font-semibold text-[#8b1e1e]/60 tracking-[0.25em] font-serif uppercase">
                    xiangqi.com official
                </div>
            </div>

            {/* Chessboard Area - Pushed even further up (top-[25px]) and scaled up */}
            <div className="absolute inset-x-0 top-[25px] flex justify-center">
                <Board 
                    board={scene.board} 
                    prevBoard={scene.prevBoard}
                    uci={scene.uci}
                    frame={frame}
                    durationInFrames={scene.durationInFrames}
                />
            </div>

            {/* Subtitle Commentary Box - Self-adjusting width/height and only visible when there's actual text */}
            {currentSubtitleText && currentSubtitleText !== "..." ? (
                <div className="absolute bottom-[30px] left-0 right-0 flex justify-center z-30 pointer-events-none">
                    <div 
                        className="px-5 py-2.5 bg-black/70 rounded-[16px] border border-gray-800/40 shadow-2xl flex justify-center items-center"


                        style={{
                            maxWidth: '85%',
                            width: 'auto',
                            display: 'inline-flex'
                        }}
                    >
                        <p 
                            className="text-2xl md:text-3xl text-[#fff0a8] font-bold tracking-[0.08em] text-center leading-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
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
        </AbsoluteFill>
    );
};

export const MyComposition: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: '#f6f1e5' }}>
            {/* 1. Deepened Mountain Background (opacity 0.85) */}
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

            {/* 2. Vector Soldier Silhouette at the bottom (opacity 0.8) */}
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

            {/* Left Top branding logo - Premium wooden Red "相" (elephant) piece icon */}
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
                            <SceneSequence scene={scene} />
                            
                            {/* Audio Tracks */}
                            <Series>
                                {[
                                    scene.audioStartFrame > 0 ? (
                                        <Series.Sequence durationInFrames={scene.audioStartFrame}>
                                            <div />
                                        </Series.Sequence>
                                    ) : null,
                                    ...(scene.subtitles || []).map((sub, sIdx) => (
                                        <Series.Sequence key={sIdx} durationInFrames={sub.durationInFrames}>
                                            <Audio src={staticFile(sub.audioFile.replace('/audio/', 'audio/'))} />
                                        </Series.Sequence>
                                    ))
                                ].filter(Boolean)}
                            </Series>
                        </Series.Sequence>
                    );
                })}
            </Series>
        </AbsoluteFill>
    );
};
