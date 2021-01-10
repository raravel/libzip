// from https://github.com/artem-karpenko/archiver-zip-encrypted/blob/master/lib/zip20/crc.js

/**
 * Build CRC table
 */
const CRC_TABLE: number[] = [];
for (let i = 0; i < 256; i++) {
	let r = i;
	for (let j = 0; j < 8; j++) {
		if ((r & 1) === 1) {
			r = (r >>> 1) ^ 0xedb88320;
		} else {
			r >>>= 1;
		}
	}
	CRC_TABLE[i] = r;
}

export default (oldCrc, charAt) => oldCrc >>> 8 ^ CRC_TABLE[(oldCrc ^ charAt) & 0xff];