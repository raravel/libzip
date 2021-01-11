import StreamBuffer from './stream-buf';
import { UINT32, SIZE } from './data-type';
import { FlagToInt16, COMP_TYPE } from './util';
import ZIP20 from './std-zip20-enc';
import { LocalFileHeader, CentralDirectory, EndOfCentralDirectory } from './zip';

import path from 'path';
import zlib from 'zlib';
import CRC32 from 'crc-32';
import fs from 'fs';


const _uint32 = n => n >>>=0;


export class ZipArchiveEntry {

	private central!: CentralDirectory;
	private header!: LocalFileHeader;
	private stream: StreamBuffer;

	constructor(private archive: ZipArchive, stream?: StreamBuffer) {
		if ( stream ) {
			this.central = new CentralDirectory(stream);
			this.stream = stream;
		} else {
			this.stream = new StreamBuffer();
		}
	}

	get CentralDirectory() {
		return this.central;
	}

	set CentralDirectory(central: CentralDirectory) {
		this.central = central;
	}

	get LocalFileHeader() {
		return this.header;
	}

	set LocalFileHeader(header: LocalFileHeader) {
		this.header = header;
	}

	get Archive() {
		return this.archive;
	}

	get CompressedLength() {
		return this.central.compressedSize;
	}

	get Crc32() {
		return this.central.crc32;
	}

	get ExternalAttributes() {
		return this.central.exAttr;
	}

	set ExternalAttributes(val: UINT32) {
		this.central.exAttr = val;
	}

	get FullName() {
		return this.central.filename;
	}

	get LastWriteTime() {
		return this.central.Date;
	}

	set LastWriteTime(val: Date) {
		this.central.Date = val;
		if ( this.header ) {
			this.header.Date = val;
		}
	}

	get Length() {
		return this.central.uncompressedSize;
	}

	get Name() {
		return path.basename(this.central.filename);
	}

	private Uncompress(data: Buffer) {
		if ( !this.header ) {
			return Buffer.from('');
		}
		let buf: Buffer = Buffer.from('');

		if ( this.header.flags.Encrypted ) {
			data = ZIP20.Decrypt(data, this.Archive.Password);
		}

		switch ( this.header.compression ) {
			case COMP_TYPE.NO_COMPRESSION:
				buf = data;
				break;
			case COMP_TYPE.DEFLATED:
				buf = zlib.inflateRawSync(data);
				break;
			default:
				throw Error(`Unknown compression method. [${this.header.compression}]`);
		}
		return buf;
	}

	private Compress(data: Buffer) {
		this.header.compression = COMP_TYPE.DEFLATED;
		data = zlib.deflateRawSync(data);

		if ( this.Archive.Password ) {
			this.header.flags.Encrypted = true;
			data = ZIP20.Encrypt(data, this.Archive.Password, this.Crc32);
		} else {
			this.header.flags.Encrypted = false;
		}

		return data;
	}

	public Init() {
		this.stream.Fd = this.central.headerOffset;
		this.header = new LocalFileHeader(this.stream);
	}

	public Delete() {
		const entries = this.Archive.Entries;
		const idx = entries.findIndex((entry => entry.FullName === this.central.filename));
		if ( idx === -1 ) {
			throw Error(`Can not find entry in archive [${this.header.filename}]`);
		}
		entries.splice(idx, 1);
	}

	public Read() {
		if ( !this.header ) {
			this.Init();
		}
		return this.Uncompress(this.header.data);
	}

	public Write(data: Buffer) {
		if ( !this.header ) {
			this.Init();
		}
		console.log(this.Name, data.length, data);

		this.header.uncompressedSize = data.length;
		this.central.uncompressedSize = data.length;

		this.header.data = this.Compress(data);

		const date = new Date();
		this.header.Date = date;
		this.central.Date = date;


		this.header.compressedSize = this.header.data.length;
		this.central.compressedSize = this.header.data.length;
	}

	public ExtractEntry(dir?: string) {
		if ( !dir ) {
			dir = path.dirname(this.archive.Filename);
		}

		const target = path.resolve(dir, this.Name);
		fs.writeFileSync(target, this.Read());
	}

}

export class ZipArchive {

	private eofDir: EndOfCentralDirectory;
	private entries: ZipArchiveEntry[] = [];
	private password: string = '';

	constructor(private filename: string, private stream?: (Buffer|StreamBuffer)) {
		if ( stream ) {
			if ( stream instanceof Buffer ) {
				stream = new StreamBuffer(stream);
			}
			stream.Fd = stream.Length - SIZE.UINT32;
			while ( !EndOfCentralDirectory.isEOCD(stream) ) {
				if ( stream.Fd === 0 ) {
					throw Error('Can not read Zip Archive');
				}
				stream.Fd -= SIZE.UINT8;
			}
			this.eofDir = new EndOfCentralDirectory(stream);

			stream.Fd = this.eofDir.recordStart;
			for ( let i=0;i < this.eofDir.recordNum;i++ ) {
				const entry = new ZipArchiveEntry(this, stream);

				this.entries.push(entry);
			}
		} else {
			this.stream = new StreamBuffer();
			this.eofDir = new EndOfCentralDirectory();
		}
	}

	get Entries() {
		return this.entries;
	}

	get Password() {
		return this.password;
	}

	set Password(val: string) {
		this.password = val;
	}

	get Filename() {
		return this.filename;
	}

	set Filename(val: string) {
		this.filename = val;
	}

	get Stream() {
		this.__stream_rewrite();
		const stream = this.stream as StreamBuffer;
		return stream.buf;
	}

	private __stream_rewrite() {
		const stream = new StreamBuffer();
		stream.Fd = 0;
		this.entries.forEach((entry: ZipArchiveEntry) => {

			const data = entry.Read();
			const header = entry.LocalFileHeader;
			const central = entry.CentralDirectory;

			const crc32 = _uint32(CRC32.buf(data));
			header.crc32 = crc32;
			central.crc32 = crc32;
			central.headerOffset = stream.Fd;

			stream.WriteUint32(header.signature);
			stream.WriteUint16(header.version);
			stream.WriteUint16(FlagToInt16(header.flags));
			stream.WriteUint16(header.compression);
			stream.WriteUint16(header.modTime);
			stream.WriteUint16(header.modDate);
			stream.WriteUint32(header.crc32);
			stream.WriteUint32(header.compressedSize);
			stream.WriteUint32(header.uncompressedSize);
			stream.WriteUint16(header.filenameLen);
			stream.WriteUint16(header.extraFieldLen);
			stream.WriteString(header.filename);
			stream.WriteBuffer(header.extraField);
			stream.WriteBuffer(header.data);
		});

		this.entries.forEach((entry: ZipArchiveEntry, idx: number) => {
			const central = entry.CentralDirectory;

			if ( idx === 0 ) {
				this.eofDir.recordStart = stream.Fd;
			}

			stream.WriteUint32(central.signature);
			stream.WriteUint16(central.version);
			stream.WriteUint16(central.extVer);
			stream.WriteUint16(FlagToInt16(central.flags));
			stream.WriteUint16(central.compression);
			stream.WriteUint16(central.modTime);
			stream.WriteUint16(central.modDate);
			stream.WriteUint32(central.crc32);
			stream.WriteUint32(central.compressedSize);
			stream.WriteUint32(central.uncompressedSize);
			stream.WriteUint16(central.filenameLen);
			stream.WriteUint16(central.extraFieldLen);
			stream.WriteUint16(central.commentLen);
			stream.WriteUint16(central.diskNumStart);
			stream.WriteUint16(central.inAttr);
			stream.WriteUint32(central.exAttr);
			stream.WriteUint32(central.headerOffset);
			stream.WriteString(central.filename);
			stream.WriteBuffer(central.extraField);
			stream.WriteString(central.comment);
		});

		this.eofDir.totalNum = this.eofDir.totalNum - this.eofDir.recordNum + this.entries.length;
		this.eofDir.recordNum = this.entries.length;

		stream.WriteUint32(this.eofDir.signature);
		stream.WriteUint16(this.eofDir.diskNum);
		stream.WriteUint16(this.eofDir.diskStart);
		stream.WriteUint16(this.eofDir.recordNum);
		stream.WriteUint16(this.eofDir.totalNum);
		stream.WriteUint32(this.eofDir.recordSize);
		stream.WriteUint32(this.eofDir.recordStart);
		stream.WriteUint16(this.eofDir.commentLen);
		stream.WriteString(this.eofDir.comment);

		this.stream = stream;
	}

	public GetEntry(entryName: string) {
		const idx = this.entries.findIndex((entry: ZipArchiveEntry) => entry.Name === entryName);
		if ( idx !== -1 ) {
			return this.entries[idx];
		}
	}

	public CreateEntry(entryName: string, buf?: Buffer) {
		const entry = new ZipArchiveEntry(this);
		const central = new CentralDirectory();
		const header = new LocalFileHeader();

		central.Filename = entryName;
		header.Filename = entryName;

		central.filenameLen = entryName.length;
		header.filenameLen = entryName.length;

		if ( this.password ) {
			central.flags.Encrypted = true;
			header.flags.Encrypted = true;
		}

		entry.CentralDirectory = central;
		entry.LocalFileHeader = header;

		if ( buf ) {
			entry.Write(buf);
		}

		this.entries.push(entry);
		return entry;
	}

	public ExtractAll(dir?: string) {
		if ( !dir ) {
			const regex = new RegExp(`${path.extname(this.filename)}$`);
			dir = this.filename.replace(regex, '');
		}

		if ( !fs.existsSync(dir) ) {
			fs.mkdirSync(dir, { recursive: true });
		}

		this.entries.forEach((entry: ZipArchiveEntry) => {
			const subdir = path.resolve(dir as string, path.dirname(entry.FullName));

			if ( !fs.existsSync(subdir) ) {
				fs.mkdirSync(subdir, { recursive: true });
			}

			entry.ExtractEntry(subdir);
		});
	}

	public Save() {
		fs.writeFileSync(this.filename, this.Stream);
	}

}

const readDirectory = (dir: string, cb: (...args: any) => any, ori_dir?: string) => {
	if ( !ori_dir ) {
		ori_dir = dir;
		dir = '';
	}

	const target = path.resolve(ori_dir, dir);
	const items = fs.readdirSync(target);
	items.forEach((item: string) => {
		const t = path.resolve(target, item);
		const st = path.join(dir, item);
		const stat = fs.statSync(t);
		cb(st, stat.isDirectory());
		if ( stat.isDirectory() ) {
			readDirectory(st, cb, ori_dir);
		}
	});
};

export class ZipFile {

	static CreateFromDirectory(src: string, dst: string, passwd?: string) {
		const stat = fs.statSync(src);
		if ( !stat.isDirectory() ) {
			throw Error(`Is not directory [${src}]`);
		}

		const archive = new ZipArchive(dst);
		archive.Password = passwd as string;

		readDirectory(src, (p: string, is_dir: boolean) => {
			const entry = archive.CreateEntry(p);
			if ( !is_dir ) {
				const target = path.resolve(src, p);
				const data = fs.readFileSync(target);
				entry.Write(data);
			}
		});

		fs.writeFileSync(dst, archive.Stream);
	}

	static ExtractToDirectory(src: string, dst: string, passwd?: string) {
		if ( fs.existsSync(dst) ) {
			throw Error(`Already file or directory [${dst}]`);
		}
		const archive = ZipFile.Open(src);

		if ( passwd ) {
			archive.Password = passwd;
		}

		archive.Entries.forEach((entry: ZipArchiveEntry) => {
			const buf = entry.Read();
			const target = path.resolve(dst, entry.FullName);
			const dir = path.dirname(target);

			if ( !fs.existsSync(dir) ) {
				fs.mkdirSync(dir);
			}

			fs.writeFileSync(target, buf);
		});
	}

	static Open(filename: string) {
		const stream = new StreamBuffer();
		stream.buf = fs.readFileSync(filename);
		return new ZipArchive(filename, stream);
	}

}
