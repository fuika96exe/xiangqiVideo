# ♟️ Xiangqi Automated Video Generation System

An automated pipeline to generate professional Xiangqi (Chinese Chess) commentary videos. This project takes structured game data (FEN/UCI) and transforms it into a fully narrated video with dynamic board animations and synchronized subtitles.

## 🌟 Key Features

- **Automated Narration**: Uses Microsoft Edge TTS to generate high-quality voiceovers.
- **Language Detection**: Automatically detects if the commentary is in English or Chinese and selects the appropriate AI voice.
- **Dynamic Board**: Renders the Xiangqi board with smooth move animations and piece highlighting.
- **Subtitle Sync**: Perfect synchronization between the spoken commentary and on-screen text.
- **Post-Production Ready**: Outputs a high-quality MP4 file ready for sharing or further editing.

---

## 🚀 Getting Started

Follow these steps to set up and run the project on your local machine.

### 1. Prerequisites

- **Node.js**: Ensure you have Node.js (version 18 or later) installed.
  - [Download Node.js](https://nodejs.org/)
- **Command Prompt**: Open your terminal (PowerShell, Command Prompt, or Git Bash).

### 2. Installation

1.  **Clone or Navigate to the Project**:
    ```powershell
    cd path/to/xiangqi-video
    ```

2.  **Install Dependencies**:
    Run the following command to install all necessary packages:
    ```powershell
    npm install
    ```

### 3. Generate Video

To create a video from a game data file (JSON), use the `make` command. 

**Command Template:**
```powershell
npm run make -- --file="GameNotesData/your_game_file.json"
```

**Example:**
```powershell
npm run make -- --file="GameNotesData/正马出动.json"
```

### 4. Workflow Overview

1.  **Data Preparation**: The script parses the input JSON, generates audio files for each commentary sentence, and calculates the timing.
2.  **Timeline Generation**: A `video-timeline.json` is created in the `src` folder.
3.  **Video Rendering**: The system automatically triggers the Remotion renderer to produce the final video.
4.  **Output**: Find your finished video at `out/video.mp4`.

---

## 🛠️ Development & Preview

If you want to preview the video before rendering or make UI adjustments:

- **Launch Studio**:
  ```powershell
  npm run dev
  ```
  This opens the Remotion Studio in your browser, where you can scrub through the timeline and see changes in real-time.

---

## 📂 Project Structure

- `scripts/prepareData.js`: The core logic for TTS generation and timeline assembly.
- `src/`: Remotion components and video layout logic.
- `GameNotesData/`: Source JSON files containing Xiangqi game notes and moves.
- `public/`: Assets like piece images and generated audio.
- `out/`: The final rendered MP4 files.

---

## 📜 License

This project is built using [Remotion](https://www.remotion.dev/). Please note that Remotion may require a company license for commercial use.
