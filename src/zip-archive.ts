import StreamBuffer from './stream-buf';
import { UINT32, UINT16, SIZE } from './data-type';
import { Flag, FLAG, parseFlag, FlagToInt16, DateToDay, DateToTime, DayToDate, TimeToDate } from './util';
import ZIP20 from './zip20';

import path from 'path';
import zlib from 'zlib';
import CRC32 from 'crc-32';
import fs from 'fs';

enum COMP_TYPE {

    NO_COMPRESSION      = 0x00, 
    SHRUNK              = 0x01, /* TODO: */
    FACTOR_1            = 0x02, /* TODO: */
    FACTOR_2            = 0x03, /* TODO: */
    FACTOR_3            = 0x04, /* TODO: */
    FACTOR_4            = 0x05, /* TODO: */
    IMPLODED            = 0x06, /* TODO: */
    RESERVED_1          = 0x07, /* TODO: */
    DEFLATED            = 0x08, 
    ENHANCED_DEFLATED   = 0x09, /* TODO: */
    DCL_IMPLODED        = 0x10, /* TODO: */
    RESERVED_2          = 0x11, /* TODO: */
    BZIP2               = 0x12, /* TODO: */
    RESERVED_3          = 0x13, /* TODO: */
    LZMA                = 0x14, /* TODO: */
    RESERVED_4          = 0x15, /* TODO: */
    RESERVED_5          = 0x16, /* TODO: */
    RESERVED_6          = 0x17, /* TODO: */
    IBM_TERSE           = 0x18, /* TODO: */
    IBM_LZ77            = 0x19, /* TODO: */
    PPMD_1              = 0x98, /* TODO: */

}

const _uint32 = n => n >>>=0;



export class LocalFileHeader {

    private readonly SIGNATURE: number = 0x04034B50;

    public signature: UINT32;
    public version: UINT16;
    public flags: Flag;
    public compression: COMP_TYPE;
    public modTime: UINT16;
    public modDate: UINT16;
    public crc32: UINT32;
    public compressedSize: UINT32;
    public uncompressedSize: UINT32;
    public filenameLen: UINT16;
    public extraFieldLen: UINT16;
    public filename: string;
    public extraField: Buffer;
    public data: Buffer;
    
    constructor(stream?: StreamBuffer) {
        if ( stream ) {
            this.signature = stream.ReadUint32();
            if ( this.signature !== this.SIGNATURE ) {
                throw Error('Can not read LocalFileHeader');
            }
            this.version = stream.ReadUint16();
            this.flags = parseFlag(stream.ReadUint16());
            this.compression = stream.ReadUint16();
            this.modTime = stream.ReadUint16();
            this.modDate = stream.ReadUint16();
            this.crc32 = stream.ReadUint32();
            this.compressedSize = stream.ReadUint32();
            this.uncompressedSize = stream.ReadUint32();
            this.filenameLen = stream.ReadUint16();
            this.extraFieldLen = stream.ReadUint16();
            this.filename = stream.ReadString(this.filenameLen);
            this.extraField = stream.ReadBuffer(this.extraFieldLen);
            this.data = stream.ReadBuffer(this.compressedSize);
        } else {
            const date = new Date();
            this.signature = this.SIGNATURE;
            this.version = 0x0a;
            this.flags = parseFlag(0);
            this.compression = COMP_TYPE.DEFLATED;
            this.modTime = DateToTime(date);
            this.modDate = DateToDay(date);
            this.crc32 = 0;
            this.compressedSize = 0;
            this.uncompressedSize = 0;
            this.filenameLen = 0;
            this.extraFieldLen = 0;
            this.filename = '';
            this.extraField = Buffer.from('');
            this.data = Buffer.from('');
        }
    }

    get Date() {
        let date = TimeToDate(this.modTime);
        date = DayToDate(this.modDate, date);
        return date;
    }

    set Date(date: Date) {
        this.modTime = DateToTime(date);
        this.modDate = DateToDay(date);
        console.log('date', this.modDate)
    }

    set Filename(name: string) {
        this.filenameLen = name.length;
        this.filename = name;
    }

}

export class CentralDirectory {

    private readonly SIGNATURE: UINT32 = 0x02014B50;

    public signature: UINT32;
    public version: UINT16;
    public extVer: UINT16;
    public flags: Flag;
    public compression: COMP_TYPE;
    public modTime: UINT16;
    public modDate: UINT16;
    public crc32: UINT32;
    public compressedSize: UINT32;
    public uncompressedSize: UINT32;
    public filenameLen: UINT16;
    public extraFieldLen: UINT16;
    public commentLen: UINT16;
    public diskNumStart: UINT16;
    public inAttr: UINT16; /* 0: apparent ASCII / text file, 2: control field records precede logical records */
    public exAttr: UINT32;
    public headerOffset: UINT32;
    public filename: string;
    public extraField: Buffer;
    public comment: string;

    constructor(stream?: StreamBuffer) {
        if ( stream ) {
            this.signature = stream.ReadUint32();
            if ( this.signature !== this.SIGNATURE ) {
                throw Error('Can not read Central Directory');
            }
            this.version = stream.ReadUint16();
            this.extVer = stream.ReadUint16();
            this.flags = parseFlag(stream.ReadUint16());
            this.compression = stream.ReadUint16();
            this.modTime = stream.ReadUint16();
            this.modDate = stream.ReadUint16();
            this.crc32 = stream.ReadUint32();
            this.compressedSize = stream.ReadUint32();
            this.uncompressedSize = stream.ReadUint32();
            this.filenameLen = stream.ReadUint16();
            this.extraFieldLen = stream.ReadUint16();
            this.commentLen = stream.ReadUint16();
            this.diskNumStart = stream.ReadUint16();
            this.inAttr = stream.ReadUint16();
            this.exAttr = stream.ReadUint32();
            this.headerOffset = stream.ReadUint32();
            this.filename = stream.ReadString(this.filenameLen);
            this.extraField = stream.ReadBuffer(this.extraFieldLen);
            this.comment = stream.ReadString(this.commentLen);
        } else {
            const date = new Date();
            this.signature = this.SIGNATURE;
            this.version = 0x0a;
            this.extVer = 0x10;
            this.flags = parseFlag(0);
            this.compression = COMP_TYPE.DEFLATED;
            this.modTime = DateToTime(date);
            this.modDate = DateToTime(date);
            this.crc32 = 0;
            this.compressedSize = 0;
            this.uncompressedSize = 0;
            this.filenameLen = 0;
            this.extraFieldLen = 0;
            this.commentLen = 0;
            this.diskNumStart = 0;
            this.inAttr = 0;
            this.exAttr = 0;
            this.headerOffset = 0;
            this.filename = '';
            this.extraField = Buffer.from('');
            this.comment = '';
        }
    }

    get Date() {
        let date = TimeToDate(this.modTime);
        date = DayToDate(this.modDate, date);
        return date;
    }

    set Date(date: Date) {
        this.modTime = DateToTime(date);
        this.modDate = DateToDay(date);
    }

    set Filename(name: string) {
        this.filenameLen = name.length;
        this.filename = name;
    }

}

export class EndOfCentralDirectory {

    private readonly SIGNATURE: UINT32 = 0x06054B50;

    public signature: UINT32;       // End of central directory signature
    public diskNum: UINT16;         // The number of this disk (containing the end of central directory record)
    public diskStart: UINT16;       // Number of the disk on which the central directory starts
    public recordNum: UINT16;       // Number of central directory records on this disk
    public totalNum: UINT16;        // Total number of central directory records
    public recordSize: UINT32;      // Size of central directory (bytes)
    public recordStart: UINT32;     // Offset of the start of the central directory on the disk on which the central directory starts
    public commentLen: UINT16;      // The length of the following comment field
    public comment: string;         // Comment

    static isEOCD(stream: StreamBuffer) {
        let signature = stream.ReadUint32();
        let ret = false;
        if ( signature === 0x06054B50 ) {
            ret = true;
        }
        stream.Fd -= SIZE.UINT32;
        return ret;
    }

    constructor(stream?: StreamBuffer) {
        if ( stream ) {
            this.signature = stream.ReadUint32();
            if ( this.signature !== this.SIGNATURE ) {
                throw Error('Can not read End of Central Directory');
            }
            this.diskNum = stream.ReadUint16();
            this.diskStart = stream.ReadUint16();
            this.recordNum = stream.ReadUint16();
            this.totalNum = stream.ReadUint16();
            this.recordSize = stream.ReadUint32();
            this.recordStart = stream.ReadUint32();
            this.commentLen = stream.ReadUint16();
            this.comment = stream.ReadString(this.commentLen);
        } else {
            this.signature = this.SIGNATURE;
            this.diskNum = 0;
            this.diskStart = 0;
            this.recordNum = 0;
            this.totalNum = 0;
            this.recordSize = 0;
            this.recordStart = 0;
            this.commentLen = 0;
            this.comment = '';
        }
    }

}

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
        console.log('comp size', this.header.compressedSize)
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

    constructor(private filename: string, private stream?: StreamBuffer) {
        if ( stream ) {
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

    public CreateEntry(entryName: string) {
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