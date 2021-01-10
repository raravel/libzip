import { UINT32, UINT16, SIZE } from './data-type';
import { Flag, parseFlag, DateToDay, DateToTime, DayToDate, TimeToDate, COMP_TYPE } from './util';
import StreamBuffer from './stream-buf';

export class LocalFileHeader {

    private readonly SIGNATURE: number = 0x04034B50;

    public signature: UINT32;           // Local file header signature = 0x04034b50 (read as a little-endian number)
    public version: UINT16;             // Version needed to extract (minimum)
    public flags: Flag;                 // General purpose bit flag
    public compression: COMP_TYPE;      // Compression method
    public modTime: UINT16;             // File last modification time
    public modDate: UINT16;             // File last modification date
    public crc32: UINT32;               // CRC-32
    public compressedSize: UINT32;      // Compressed size
    public uncompressedSize: UINT32;    // Uncompressed size
    public filenameLen: UINT16;         // File name length (n)
    public extraFieldLen: UINT16;       // Extra field length (m)
    public filename: string;            // File name
    public extraField: Buffer;          // Extra field
    public data: Buffer;                // File data
    
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

    public signature: UINT32;           // Central directory file header signature = 0x02014b50
    public version: UINT16;             // Version made by
    public extVer: UINT16;              // Version needed to extract (minimum)
    public flags: Flag;                 // General purpose bit flag
    public compression: COMP_TYPE;      // Compression method
    public modTime: UINT16;             // File last modification time
    public modDate: UINT16;             // File last modification date
    public crc32: UINT32;               // CRC-32
    public compressedSize: UINT32;      // Compressed size
    public uncompressedSize: UINT32;    // Uncompressed size
    public filenameLen: UINT16;         // File name length (n)
    public extraFieldLen: UINT16;       // Extra field length (m)
    public commentLen: UINT16;          // File comment length (k)
    public diskNumStart: UINT16;        // Disk number where file starts
    public inAttr: UINT16;              // 0: apparent ASCII / text file, 2: control field records precede logical records
    public exAttr: UINT32;              // External file attributes
    public headerOffset: UINT32;        // Relative offset of local file header. This is the number of bytes between the start of the first disk on which the file occurs, and the start of the local file header. This allows software reading the central directory to locate the position of the file inside the .ZIP file.
    public filename: string;            // File name
    public extraField: Buffer;          // Extra field
    public comment: string;             // File comment

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