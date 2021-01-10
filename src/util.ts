import { UINT32, UINT16, SIZE } from './data-type';

export enum COMP_TYPE {

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
    CompressionOption1: boolean,
    CompressionOption2: boolean,
    Descriptor: boolean,
    EnhancedDeflation: boolean,
    PatchedData: boolean,
    StrongEnc: boolean,
    Encoding: boolean,
    MaskHeader: boolean,

}

export enum FLAG {
    ENCRYPTED_FILE          = 0b0000000000000000001,
    COMPRESSION_OPTION_1    = 0b0000000000000000010,
    COMPRESSION_OPTION_2    = 0b0000000000000000100,
    DATA_DESCRIPTOR         = 0b0000000000000001000,
    ENHANCED_DEFLATION      = 0b0000000000000010000,
    COMPRESSED_PATCHED_DATA = 0b0000000000000100000,
    STRONG_ENCRYPTION       = 0b0000000000001000000,
    UNUSED_1                = 0b0000000000010000000,
    UNUSED_2                = 0b0000000000100000000,
    UNUSED_3                = 0b0000000001000000000,
    UNUSED_4                = 0b0000000010000000000,
    LANGUAGE_ENCODING       = 0b0000000100000000000,
    RESERVED_1              = 0b0000001000000000000,
    MASK_HEADER_VALUES      = 0b0000010000000000000,
    RESERVED_2              = 0b0000100000000000000,
    RESERVED_3              = 0b0001000000000000000,
}

export const parseFlag = (flag: UINT16) => {
    const ret = {} as Flag;
    ret.Encrypted = !!(flag & FLAG.ENCRYPTED_FILE);
    ret.CompressionOption1 = !!(flag & FLAG.COMPRESSION_OPTION_1);
    ret.CompressionOption2 = !!(flag & FLAG.COMPRESSION_OPTION_2);
    ret.Descriptor = !!(flag & FLAG.DATA_DESCRIPTOR);
    ret.EnhancedDeflation = !!(flag & FLAG.ENHANCED_DEFLATION);
    ret.PatchedData = !!(flag & FLAG.COMPRESSED_PATCHED_DATA);
    ret.StrongEnc = !!(flag & FLAG.STRONG_ENCRYPTION);
    ret.Encoding = !!(flag & FLAG.LANGUAGE_ENCODING);
    ret.MaskHeader = !!(flag & FLAG.MASK_HEADER_VALUES);
    return ret;
}

export const FlagToInt16 = (flag: Flag) => {
    let ret = 0;
    ret |= (flag.Encrypted ? FLAG.ENCRYPTED_FILE : 0);
    ret |= (flag.CompressionOption1 ? FLAG.COMPRESSION_OPTION_1 : 0);
    ret |= (flag.CompressionOption2 ? FLAG.COMPRESSION_OPTION_2 : 0);
    ret |= (flag.Descriptor ? FLAG.DATA_DESCRIPTOR : 0);
    ret |= (flag.EnhancedDeflation ? FLAG.ENHANCED_DEFLATION : 0);
    ret |= (flag.PatchedData ? FLAG.COMPRESSED_PATCHED_DATA : 0);
    ret |= (flag.StrongEnc ? FLAG.STRONG_ENCRYPTION : 0);
    ret |= (flag.Encoding ? FLAG.LANGUAGE_ENCODING : 0);
    ret |= (flag.MaskHeader ? FLAG.MASK_HEADER_VALUES : 0);
    return ret;
}

export const DayToDate = (day: UINT16, date: Date = new Date(0)) => {
    const year  = (day & 0b1111111000000000);
    const month = (day & 0b0000000111100000);
    const d     = (day & 0b0000000000011111);
    date.setFullYear(year + 1980);
    date.setMonth(month - 1);
    date.setDate(d);
    return date;
}

export const TimeToDate = (time: UINT16, date: Date = new Date(0)) => {
    const hour   = (time & 0b1111100000000000);
    const minute = (time & 0b0000011111100000);
    const sec    = (time & 0b0000000000011111);
    date.setHours(hour);
    date.setMinutes(minute);
    date.setSeconds(sec * 2);
    return date;
}

export const DateToDay = (date: Date) => {
    let ret: number = 0;
    const year = date.getFullYear() - 1980;
    const month = (date.getMonth() + 1);
    const d = date.getDate();
    ret |= year << 9;
    ret |= month << 5;
    ret |= d;
    return ret;
}

export const DateToTime = (date: Date) => {
    let ret: number = 0;
    const hour = date.getHours();
    const minute = date.getMinutes();
    const sec = Math.floor(date.getSeconds() / 2);
    ret |= hour << 11;
    ret |= minute << 5;
    ret |= sec;
    return ret;
}