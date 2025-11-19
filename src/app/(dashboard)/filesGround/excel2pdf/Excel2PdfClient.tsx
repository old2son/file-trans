'use client';

import { useState } from 'react';
import FileBtn from './FileBtn';
import LoadingBar from './LoadingBar';

export default function Excel2PdfClient() {
	const loading = true;
	const [progressValue, setProgress] = useState(0);

	return (
		<>
			<FileBtn onProgress={setProgress} />
			{/* {progress > 0 && progress < 100 && <LoadingBar value={progress} />} */}
			{loading && <LoadingBar progress={progressValue} />}
		</>
	);
}
