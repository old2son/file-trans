export default function setRem(cb?: () => void) {
	// 大于750px时，按750px计算
	if (document.documentElement.clientWidth > 750) {
        document.documentElement.style.fontSize = '16px';
        cb?.();
		return;
	}

	const designWidth = 750;
	const baseFont = 32;
    document.documentElement.style.fontSize = (document.documentElement.clientWidth / designWidth) * baseFont + 'px';
    cb?.();
}
