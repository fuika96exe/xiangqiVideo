const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\user\\Downloads\\game_notes_export (1)\\q8OE2o.json';
const destPath = path.join(__dirname, '..', 'GameNotesData', 'q8OE2o_normalized.json');

try {
    const rawData = fs.readFileSync(srcPath, 'utf8');
    const input = JSON.parse(rawData);

    const output = {
        initial_position: input.initial_fen || input.initial_position,
        title: input.title,
        initial_position_annotation: input.overview || input.initial_position_annotation || input['initial position annotation'],
        annotations: input.moves || input.annotations || []
    };

    fs.writeFileSync(destPath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`✅ Successfully normalized and saved to ${destPath}`);
} catch (e) {
    console.error('❌ Error during normalization:', e);
}
