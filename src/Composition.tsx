import { AbsoluteFill, Series, Audio, staticFile } from 'remotion';
import timeline from './video-timeline.json';
import Board from './components/Board';
import React from 'react';
import './index.css';
import './Composition.css'; 

export const MyComposition: React.FC = () => {
    return (
        <AbsoluteFill className="bg-black">
            <Series>
                {timeline.map((scene, idx) => (
                    <Series.Sequence key={idx} durationInFrames={scene.durationInFrames}>
                        <AbsoluteFill>
                            {/* 右上角：标题更小，品牌更显眼 */}
                            <div className="absolute top-8 right-10 text-right pr-4 border-r-2 border-yellow-600/50">
                                <h1 className="text-lg font-serif font-bold text-yellow-500/90 tracking-[0.2em]">
                                    {scene.title || "象棋兵法"}
                                </h1>
                                <div className="text-sm text-gray-400 font-medium mt-1 tracking-[0.1em] lowercase">xiangqi.com official</div>
                            </div>

                            {/* 棋盘区域：去除外框，实现无缝融合 */}
                            <div className="absolute inset-0 flex items-center justify-center -top-20">
                                <Board board={scene.board} moveHistory={[]} viewIndex={-1} turn={1} />
                            </div>

                            {/* 字幕区域：纯净文本 + 悬浮质感 */}
                            <div className="absolute bottom-[80px] left-0 right-0 flex justify-center">
                                <Series>
                                    {/* 0.5s 画面优先展示延迟 */}
                                    {scene.audioStartFrame > 0 && (
                                        <Series.Sequence durationInFrames={scene.audioStartFrame}>
                                            <div />
                                        </Series.Sequence>
                                    )}
                                    
                                    {(scene.subtitles || []).map((sub, sIdx) => (
                                        <Series.Sequence key={sIdx} durationInFrames={sub.durationInFrames}>
                                            <div className="flex justify-center items-center w-[1920px]">
                                                <p className="text-3xl text-[#FFD700] font-bold tracking-[0.2em] text-center leading-relaxed drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] max-w-[80%]">
                                                    {sub.text}
                                                </p>
                                            </div>
                                        </Series.Sequence>
                                    ))}
                                </Series>
                            </div>
                        </AbsoluteFill>
                        
                        {/* Audio Tracks */}
                        <Series>
                            {/* 0.5s 语音延迟 */}
                            {scene.audioStartFrame > 0 && (
                                <Series.Sequence durationInFrames={scene.audioStartFrame}>
                                    <div />
                                </Series.Sequence>
                            )}
                            
                            {(scene.subtitles || []).map((sub, sIdx) => (
                                <Series.Sequence key={sIdx} durationInFrames={sub.durationInFrames}>
                                    <Audio src={staticFile(sub.audioFile.replace('/audio/', 'audio/'))} />
                                </Series.Sequence>
                            ))}
                        </Series>
                    </Series.Sequence>
                ))}
            </Series>
        </AbsoluteFill>
    );
};
