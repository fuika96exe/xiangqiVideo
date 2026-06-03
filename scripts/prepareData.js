const fs = require('fs');
const path = require('path');
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const tts = new MsEdgeTTS();
const mp3Duration = require('mp3-duration');
const { execSync } = require('child_process');

// Parse --file argument
const args = process.argv.slice(2);
let dataFilePath = '';
args.forEach(arg => {
    if (arg.startsWith('--file=')) {
        dataFilePath = arg.split('=')[1].replace(/^"(.*)"$/, '$1');
    }
});

if (!dataFilePath) {
    console.error("❌ Error: Please specify a file using --file=\"path/to/json\"");
    process.exit(1);
}

const OUTPUT_JSON = path.join(__dirname, '..', 'src', 'video-timeline.json');
const AUDIO_DIR = path.join(__dirname, '..', 'public', 'audio');

// Setup Audio Directory
if (fs.existsSync(AUDIO_DIR)) {
    fs.readdirSync(AUDIO_DIR).forEach(file => fs.unlinkSync(path.join(AUDIO_DIR, file)));
} else {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// FEN Parsing Logic
const ROWS = 10, COLS = 9, RED = 'red', BLACK = 'black';
const CHAR_TO_PIECE = { 'k': 'king', 'a': 'advisor', 'e': 'elephant', 'h': 'horse', 'r': 'chariot', 'c': 'cannon', 'p': 'soldier', 'b': 'elephant', 'n': 'horse' };

function parseFen(fenString) {
    const boardPart = fenString.trim().split(/\s+/)[0];
    const rows = boardPart.split('/');
    const newBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    rows.forEach((rowStr, r) => {
        let c = 0;
        for (let i = 0; i < rowStr.length; i++) {
            const char = rowStr[i];
            if (/\d/.test(char)) c += parseInt(char, 10);
            else {
                const type = CHAR_TO_PIECE[char.toLowerCase()];
                const color = char === char.toUpperCase() ? RED : BLACK;
                if (type) newBoard[r][c] = { type, color };
                c++;
            }
        }
    });
    return { board: newBoard };
}

function applyMove(board, uci) {
    const match = uci.match(/^([a-i])([0-9]+)([a-i])([0-9]+)$/);
    const c1 = match[1].charCodeAt(0) - 'a'.charCodeAt(0), r1 = 10 - parseInt(match[2], 10);
    const c2 = match[3].charCodeAt(0) - 'a'.charCodeAt(0), r2 = 10 - parseInt(match[4], 10);
    const newBoard = board.map(row => [...row]);
    newBoard[r2][c2] = newBoard[r1][c1];
    newBoard[r1][c1] = null;
    return newBoard;
}

function cleanSentence(s) {
    return s.replace(/^[，,；;。！？.!?\s\n]+/, '').replace(/[，,；;。！？.!?\s\n]+$/, '').trim();
}

function splitCommentary(text) {
    if (!text) return [];
    const isEnglishText = /[a-zA-Z]/.test(text) && !/[\u4e00-\u9fa5]/.test(text);
    const limit = isEnglishText ? 65 : 18;
    const splitRegex = isEnglishText ? /([,;])/ : /([，,；;\s])/;

    const parts = text.match(/([^。！？.!?\n]+[。！？.!?\n]?)/g) || [text];
    const finalParts = [];
    
    parts.forEach(part => {
        const cleanedPart = cleanSentence(part);
        if (cleanedPart.length <= limit) {
            if (/[a-zA-Z0-9\u4e00-\u9fa5]/.test(cleanedPart)) {
                finalParts.push(cleanedPart);
            }
        } else {
            const subParts = cleanedPart.split(splitRegex);
            let current = "";
            subParts.forEach(sub => {
                const combined = current + sub;
                const cleanedCombined = cleanSentence(combined);
                if (cleanedCombined.length > limit && cleanSentence(current).length > 0) {
                    const toPush = cleanSentence(current);
                    if (/[a-zA-Z0-9\u4e00-\u9fa5]/.test(toPush)) {
                        finalParts.push(toPush);
                    }
                    current = sub;
                } else {
                    current = combined;
                }
            });
            const toPush = cleanSentence(current);
            if (toPush && /[a-zA-Z0-9\u4e00-\u9fa5]/.test(toPush)) {
                finalParts.push(toPush);
            }
        }
    });
    return finalParts;
}

function convertMoveNotation(text) {
    if (!text) return "";
    const numMap = {
        '1': '一', '2': '二', '3': '三', '4': '四', '5': '五',
        '6': '六', '7': '七', '8': '八', '9': '九'
    };
    const actionMap = {
        '+': '进', '-': '退', '=': '平'
    };
    return text.replace(/([车马炮卒兵仕士相象帅将])(\d)([\+\-=])(\d)/g, (match, piece, n1, action, n2) => {
        const cn1 = numMap[n1] || n1;
        const cnAct = actionMap[action] || action;
        const cn2 = numMap[n2] || n2;
        return `${piece}${cn1}${cnAct}${cn2}`;
    });
}


async function prepareData() {
    console.log("🚀 Starting data preparation...");
    
    console.log("📖 Reading game file:", dataFilePath);
    
    let resolvedPath = dataFilePath;
    if (!fs.existsSync(resolvedPath)) {
        const altPath = path.join(__dirname, '..', 'GameNotesData', dataFilePath);
        if (fs.existsSync(altPath)) {
            resolvedPath = altPath;
            console.log("📍 Found file in GameNotesData:", resolvedPath);
        } else {
            console.error(`❌ Error: File not found: ${dataFilePath}`);
            console.error(`Checked locations:\n - ${path.resolve(dataFilePath)}\n - ${altPath}`);
            process.exit(1);
        }
    }

    const data = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
    
    // Convert Chinese move notations
    if (data.note) data.note = convertMoveNotation(data.note);
    if (data['initial position annotation']) data['initial position annotation'] = convertMoveNotation(data['initial position annotation']);
    if (data.initial_position_annotation) data.initial_position_annotation = convertMoveNotation(data.initial_position_annotation);
    if (data.annotations) {
        const processNode = (node) => {
            if (node.note) node.note = convertMoveNotation(node.note);
            if (node.moves) node.moves.forEach(processNode);
        };
        data.annotations.forEach(processNode);
    }

    
    // Detect language from title or first note
    const firstNote = data.annotations && data.annotations[0] && data.annotations[0].note || "";
    const isEnglish = /[a-zA-Z]/.test(data.title || firstNote) && !/[\u4e00-\u9fa5]/.test(data.title || firstNote);
    const voice = isEnglish ? "en-US-GuyNeural" : "zh-CN-YunxiNeural";
    console.log(`🎙️ Using voice: ${voice} (${isEnglish ? 'English' : 'Chinese'})`);
    
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const timeline = [];
    let audioCounter = 0;

    function splitSentenceIntoSubtitles(text, isEng) {
        if (!text) return [];
        const limit = isEng ? 65 : 18;
        const cleaned = cleanSentence(text);
        if (cleaned.length <= limit) {
            return [cleaned];
        }
        
        const firstSplitRegex = isEng ? /([,;:\(\)\-]|--)/ : /([，,；;\s])/;
        const rawParts = cleaned.split(firstSplitRegex).map(p => p.trim()).filter(Boolean);
        
        const result = [];
        let current = "";
        
        for (const part of rawParts) {
            // Clean up leading punctuation from part
            const cleanedPart = cleanSentence(part);
            if (!cleanedPart) continue;
            
            const combined = current ? `${current} ${cleanedPart}` : cleanedPart;
            if (combined.length <= limit) {
                current = combined;
            } else {
                if (current) {
                    result.push(cleanSentence(current));
                    current = cleanedPart;
                } else {
                    current = cleanedPart;
                }
                
                if (current.length > limit) {
                    const words = current.split(/\s+/);
                    let subLine = "";
                    for (const w of words) {
                        if (subLine.length + w.length + 1 > limit) {
                            if (subLine) result.push(cleanSentence(subLine));
                            subLine = w;
                        } else {
                            subLine = subLine ? `${subLine} ${w}` : w;
                        }
                    }
                    current = subLine;
                }
            }
        }
        if (current) {
            result.push(cleanSentence(current));
        }
        return result.filter(Boolean);
    }

    async function generateAudioAndSubtitles(text, audioStartFrame, isEng) {
        const majorSentences = text.match(/([^。！？.!?\n]+[。！？.!?\n]?)/g) || [text];
        const subtitles = [];
        const audios = [];
        let currentAudioStart = audioStartFrame;
        
        for (const major of majorSentences) {
            const cleanedMajor = cleanSentence(major);
            if (!/[a-zA-Z0-9\u4e00-\u9fa5]/.test(cleanedMajor)) continue;
            
            const filename = `audio_${audioCounter++}.mp3`;
            const filepath = path.join(AUDIO_DIR, filename);
            
            let success = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    console.log(`🎙️ [Attempt ${attempt}] Generating major sentence: "${cleanedMajor.substring(0, 30)}${cleanedMajor.length > 30 ? '...' : ''}"`);
                    const result = tts.toStream(cleanedMajor);
                    await new Promise((res, rej) => {
                        const ws = fs.createWriteStream(filepath);
                        result.audioStream.pipe(ws);
                        ws.on('close', res);
                        ws.on('error', rej);
                        result.audioStream.on('error', rej);
                        setTimeout(() => rej(new Error("TTS Timeout")), 15000);
                    });
                    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) {
                        success = true;
                        break;
                    }
                } catch (err) {
                    console.warn(`⚠️ Attempt ${attempt} failed for ${filename}. Retrying...`);
                }
            }
            
            if (!success) {
                console.error(`❌ Error: Audio generation failed for: ${cleanedMajor}`);
                process.exit(1);
            }
            
            const duration = await new Promise(r => mp3Duration(filepath, (e, d) => r(d || 1)));
            const frames = Math.ceil(duration * 30);
            
            audios.push({
                file: `/audio/${filename}`,
                startFrame: currentAudioStart,
                durationInFrames: frames
            });
            
            const subs = splitSentenceIntoSubtitles(cleanedMajor, isEng);
            const totalChars = subs.reduce((sum, s) => sum + s.length, 0);
            
            let allocatedFrames = 0;
            subs.forEach((subText, idx) => {
                let subFrames = 0;
                if (idx === subs.length - 1) {
                    subFrames = frames - allocatedFrames;
                } else {
                    subFrames = Math.round(frames * (subText.length / totalChars));
                }
                allocatedFrames += subFrames;
                
                subtitles.push({
                    text: subText,
                    durationInFrames: subFrames
                });
            });
            
            currentAudioStart += frames;
        }
        
        return { subtitles, audios, totalFrames: currentAudioStart - audioStartFrame };
    }
 
    async function processMoveNode(node, currentBoard, prevBoard, isMainLine, depth) {
        const scene = { 
            type: 'move', 
            uci: node.uci, 
            board: currentBoard, 
            prevBoard, 
            isMainLine, 
            depth, 
            title: data.title || "象棋兵法", 
            subtitles: [],
            audios: [],
            audioStartFrame: 15
        };
 
        if (node.note) {
            const { subtitles, audios, totalFrames } = await generateAudioAndSubtitles(node.note, scene.audioStartFrame, isEnglish);
            scene.subtitles = subtitles;
            scene.audios = audios;
            scene.durationInFrames = scene.audioStartFrame + totalFrames + 15;
        } else {
            scene.durationInFrames = 45;
        }
        
        timeline.push(scene);
 
        if (node.moves && node.moves.length > 0) {
            // Process branches in reverse order
            const reversedMoves = [...node.moves].reverse();
            for (const nextMove of reversedMoves) {
                await processMoveNode(nextMove, applyMove(currentBoard, nextMove.uci), currentBoard, false, depth + 1);
            }
        }
    }
 
    const { board: initialBoard } = parseFen(data.initial_position);
 
    // Initial Position Annotation
    const initialNote = data['initial position annotation'] || data.initial_position_annotation;
    if (initialNote) {
        console.log("📖 Processing initial position annotation...");
        const scene = {
            type: 'initial',
            board: initialBoard,
            prevBoard: initialBoard,
            isMainLine: true,
            depth: 0,
            title: data.title || "象棋兵法",
            subtitles: [],
            audios: [],
            audioStartFrame: 10
        };
        const { subtitles, audios, totalFrames } = await generateAudioAndSubtitles(initialNote, scene.audioStartFrame, isEnglish);
        scene.subtitles = subtitles;
        scene.audios = audios;
        scene.durationInFrames = scene.audioStartFrame + totalFrames + 15;
        timeline.push(scene);
    }
 
    if (data.annotations && data.annotations.length > 0) {
        // Process top-level annotations in reverse order
        const reversedAnnos = [...data.annotations].reverse();
        for (const anno of reversedAnnos) {
            await processMoveNode(anno, applyMove(initialBoard, anno.uci), initialBoard, true, 0);
        }
    }

    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(timeline, null, 2));
    console.log("✨ Timeline generated. Starting video render...");
    
    // Auto-trigger Remotion Render
    try {
        execSync('npm run render', { stdio: 'inherit' });
        console.log("✅ Video successfully rendered to out/video.mp4");
    } catch (e) {
        console.error("❌ Render failed, please check Remotion errors above.");
    }
}

prepareData().catch(console.error);
