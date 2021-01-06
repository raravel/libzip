/*
 * file-manager.ts
 * Created on Wed Jan 06 2021
 *
 * Copyright (c) raravel. Licensed under the MIT License.
 */

import fs from 'fs';

export enum SIZE {

    INT8 = 1,
    INT16 = 2,
    INT32 = 4,
    INT64 = 8,

    UINT8 = 1,
    UINT16 = 2,
    UINT32 = 4,
    UINT64 = 8,

};

export class FileManager {
    private buf!: Buffer;
    private fd: number = 0; 

    constructor(filename: string, options: any = {}) {
        if ( !fs.existsSync(filename) ) {
            throw Error(`No such file [${filename}].`);
        }

        this.buf = fs.readFileSync(filename, options);
    }

    public ReadUint8() {
        let ret = 0;
        ret = this.buf.readUInt8(this.fd);
        this.fd += SIZE.UINT8;
        return ret;
    }

    public ReadUint16(use_be: boolean = false) {
        let ret = 0;
        if ( use_be ) {
            ret = this.buf.readUInt16BE(this.fd);
        } else {
            ret = this.buf.readUInt16LE(this.fd);
        }
        this.fd += SIZE.UINT16;
        return ret;
    }

    public ReadUint32(use_be: boolean = false) {
        let ret = 0;
        if ( use_be ) {
            ret = this.buf.readUInt32BE(this.fd);
        } else {
            ret = this.buf.readUInt32LE(this.fd);
        }
        this.fd += SIZE.UINT32;
        return ret;
    }

    public ReadString(len: number) {
        let ret = '';
        let b_ = this.buf.subarray(this.fd, this.fd + len);
        ret = b_.toString();
        this.fd += len;
        return ret;
    }

}
