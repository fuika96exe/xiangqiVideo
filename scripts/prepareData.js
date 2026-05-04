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

function splitCommentary(text) {
    if (!text) return [];
    const parts = text.match(/([^。！？.!?]+[。！？.!?]?)/g) || [text];
    const finalParts = [];
    
    parts.forEach(part => {
        if (part.length <= 18) {
            const trimmed = part.trim();
            // Only add if it contains more than just punctuation
            if (/[a-zA-Z0-9\u4e00-\u9fa5]/.test(trimmed)) {
                finalParts.push(trimmed);
            }
        } else {
            const subParts = part.split(/([，,])/);
            let current = "";
            subParts.forEach(sub => {
                if ((current + sub).length > 18 && current.length > 0) {
                    if (/[a-zA-Z0-9\u4e00-\u9fa5]/.test(current)) {
                        finalParts.push(current.trim());
                    }
                    current = sub;
                } else {
                    current += sub;
                }
            });
            if (current.trim() && /[a-zA-Z0-9\u4e00-\u9fa5]/.test(current)) {
                finalParts.push(current.trim());
            }
        }
    });
    return finalParts;
}

async function prepareData() {
    console.log("🚀 Starting data preparation...");
    
    console.log("📖 Reading game file:", dataFilePath);
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
    
    // Detect language from title or first note
    const firstNote = data.annotations && data.annotations[0] && data.annotations[0].note || "";
    const isEnglish = /[a-zA-Z]/.test(data.title || firstNote) && !/[\u4e00-\u9fa5]/.test(data.title || firstNote);
    const voice = isEnglish ? "en-US-GuyNeural" : "zh-CN-YunxiNeural";
    console.log(`🎙️ Using voice: ${voice} (${isEnglish ? 'English' : 'Chinese'})`);
    
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const timeline = [];
    let audioCounter = 0;

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
            audioStartFrame: 15 // 0.5s pause after move
        };
        if (node.note) {
            const sentences = splitCommentary(node.note);
            let totalFrames = 0;
            for (const s of sentences) {
                const filename = `audio_${audioCounter++}.mp3`;
                const filepath = path.join(AUDIO_DIR, filename);
                
                let success = false;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        console.log(`🎙️ [Attempt ${attempt}] Generating: "${s.substring(0, 20)}${s.length > 20 ? '...' : ''}"`);
                        const result = tts.toStream(s);
                        await new Promise((res, rej) => {
                            const ws = fs.createWriteStream(filepath);
                            result.audioStream.pipe(ws);
                            ws.on('close', res);
                            ws.on('error', rej);
                            result.audioStream.on('error', rej);
                            // Set a timeout for the stream
                            setTimeout(() => rej(new Error("TTS Timeout")), 10000);
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
                    console.error(`❌ Error: Audio generation failed after 3 attempts for: ${filename}`);
                    process.exit(1);
                }

                const duration = await new Promise(r => mp3Duration(filepath, (e, d) => r(d || 1)));
                const frames = Math.ceil(duration * 30);
                scene.subtitles.push({ text: s, audioFile: `/audio/${filename}`, durationInFrames: frames });
                totalFrames += frames;
            }
            scene.durationInFrames = scene.audioStartFrame + totalFrames + 15;
        } else {
            scene.durationInFrames = 45;
        }
        timeline.push(scene);
        if (node.moves && node.moves.length > 0) {
            const mainMove = node.moves[0];
            await processMoveNode(mainMove, applyMove(currentBoard, mainMove.uci), currentBoard, isMainLine, depth);
        }
    }

    const { board: initialBoard } = parseFen(data.initial_position);
    if (data.annotations && data.annotations.length > 0) {
        await processMoveNode(data.annotations[0], applyMove(initialBoard, data.annotations[0].uci), initialBoard, true, 0);
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
