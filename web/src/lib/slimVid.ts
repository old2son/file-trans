import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. 在 ESM 中手动获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = './';
const outputDir = './output';

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const files = fs.readdirSync(inputDir).filter((f) => f.endsWith('.mp4'));

files.forEach((file, index) => {
	const inputPath = path.join(inputDir, file);
	const outputPath = path.join(outputDir, `compressed_${file}`);

	console.log(`[${index + 1}/${files.length}] 正在处理: ${file}`);

	// 依然建议保留 shell: 'bash' 解决 Windows 路径问题
	const command = `ffmpeg -i "${file}" -c:v libx264 -preset slower -crf 26 -vf "scale='min(1920,iw)':-2" -c:a aac -b:a 128k -movflags +faststart "${outputPath}" -y`;

	try {
		execSync(command, {
			stdio: 'inherit',
			shell: 'bash'
		});
	} catch (err) {
		console.error(`处理 ${file} 出错`);
	}
});
