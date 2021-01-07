import { FileManager } from './file-manager';
import { UINT32, UINT16, SIZE } from './data-type';
import path from 'path';
import zlib from 'zlib';

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

export enum CD_VER {

    MSDOS           = 0x00,
    AMIGA           = 0x01,
    OPEN_VMS        = 0x02,
    UNIX            = 0x03,
    VM_CMS          = 0x04,
    ATARI_ST        = 0x05,
    HPFS            = 0x06,
    MACHINTOSH      = 0x07,
    ZSYSTEM         = 0x08,
    CPM             = 0x09,
    NTFS            = 0x10,
    MVS             = 0x11,
    VSE             = 0x12,
    ACORN           = 0x13,
    VFAT            = 0x14,
    ALTERNATE_MVS   = 0x15,
    BEOS            = 0x16,
    TANDEM          = 0x17,
    OS400           = 0x18,
    OSX_DARWIN      = 0x19,

}

export interface Flag {
    
    Encrypted: boolean,
    CompressionOption: boolean,
    Descriptor: boolean,
    EnhancedDeflation: boolean,
    PatchedData: boolean,
    StrongEnc: boolean,
    Encoding: boolean,
    MaskHeader: boolean,

}

export class LocalFileHeader {

    public signature: UINT32;
    public version: UINT16;
    public flags: UINT16; /* TODO: */
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
    
    constructor(stream: FileManager) {
        this.signature = stream.ReadUint32();
        if ( this.signature !== 0x04034B50 ) {
            throw Error('Can not read LocalFileHeader');
        }
        this.version = stream.ReadUint16();
        this.flags = stream.ReadUint16();
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
    }

}

export class CentralDirectory {

    public signature: UINT32;
    public version: UINT16;
    public extVer: UINT16;
    public flag: UINT16;
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

    constructor(stream: FileManager) {
        this.signature = stream.ReadUint32();
        if ( this.signature !== 0x02014B50 ) {
            throw Error('Can not read Central Directory');
        }
        this.version = stream.ReadUint16();
        this.extVer = stream.ReadUint16();
        this.flag = stream.ReadUint16();
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
    }

}

export class EndOfCentralDirectory {

    public signature: UINT32;
    public diskNum: UINT16;
    public diskStart: UINT16;
    public recordNum: UINT16;
    public totalNum: UINT16;
    public recordSize: UINT32;
    public recordStart: UINT32;
    public commentLen: UINT16;
    public comment: string;

    static isEOCD(stream: FileManager) {
        let signature = stream.ReadUint32();
        let ret = false;
        if ( signature === 0x06054B50 ) {
            ret = true;
        }
        stream.Fd -= SIZE.UINT32;
        return ret;
    }

    constructor(stream: FileManager) {
        this.signature = stream.ReadUint32();
        if ( this.signature !== 0x06054B50 ) {
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
    }

}

export class ZipArchiveEntry {

    private central!: CentralDirectory;
    private header!: LocalFileHeader;

    constructor(private archive: ZipArchive, private stream: FileManager) {
        this.central = new CentralDirectory(stream);
    }

    set CentralDirectory(central: CentralDirectory) {
        this.central = central;
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
        /* TODO: */
        return new Date();
    }

    set LastWriteTime(val: Date) {
        /* TODO: */
    }

    get Length() {
        return this.central.uncompressedSize;
    }

    get Name() {
        return path.basename(this.central.filename);
    }

    private Uncompress() {
        if ( !this.header ) {
            return;
        }
        let buf: Buffer;
        switch ( this.header.compression ) {
            case COMP_TYPE.NO_COMPRESSION:
                buf = this.header.data;
                break;
            case COMP_TYPE.DEFLATED:
                buf = zlib.inflateRawSync(this.header.data);
                break;
            default:
                throw Error(`Unknown compression method. [${this.header.compression}]`);
        }
        return buf;
    }

    public Delete() {
        /* TODO: https://docs.microsoft.com/ko-kr/dotnet/api/system.io.compression.ziparchiveentry.delete?view=net-5.0 */
    }

    public Open() {
        this.stream.Fd = this.central.headerOffset;
        this.header = new LocalFileHeader(this.stream);
        return this.Uncompress();
    }

}

export class ZipArchive {

    private eofDir: EndOfCentralDirectory;
    private entries: ZipArchiveEntry[] = [];
    private password: string = '';

    constructor(private stream: FileManager) {
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

    public GetEntry(entryName: string) {
        const idx = this.entries.findIndex((entry: ZipArchiveEntry) => entry.Name === entryName);
        if ( idx !== -1 ) {
            return this.entries[idx];
        }
    }

    public CreateEntry(entryName: string) {
        /* TODO: https://docs.microsoft.com/ko-kr/dotnet/api/system.io.compression.ziparchive.createentry?view=net-5.0 */
    }

    public Dispose(disposing?: boolean) {
        /* TODO: https://docs.microsoft.com/ko-kr/dotnet/api/system.io.compression.ziparchive.dispose?view=net-5.0 */
    }

}

export class ZipFile {

    static CreateFromDirectory(src: string, dst: string) {
        /* TODO: https://docs.microsoft.com/ko-kr/dotnet/api/system.io.compression.zipfile.createfromdirectory?view=net-5.0 */
    }

    static ExtractToDirectory(src: string, dst: string) {
        /* TODO: https://docs.microsoft.com/ko-kr/dotnet/api/system.io.compression.zipfile.extracttodirectory?view=net-5.0 */
    }

    static Open(filename: string) {
        const fm = new FileManager(filename);
        return new ZipArchive(fm);
    }

}