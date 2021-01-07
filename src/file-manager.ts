/*
 * file-manager.ts
 * Created on Wed Jan 06 2021
 *
 * Copyright (c) raravel. Licensed under the MIT License.
 */

import fs from 'fs';
import { SIZE } from './data-type';

export class FileManager {
    private buf!: Buffer;
    private fd: number = 0; 

    constructor(filename?: string, options: any = {}) {
        if ( filename ) {
            if ( !fs.existsSync(filename) ) {
                throw Error(`No such file [${filename}].`);
            }

            this.buf = fs.readFileSync(filename, options);
        } else {
            this.buf = Buffer.from('');
        }
    }

    get Fd() {
        return this.fd;
    }

    set Fd(fd: number) {
        this.fd = fd;
    }

    get Length() {
        return this.buf.length;
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

    public ReadBuffer(len: number) {
        let ret = this.buf.subarray(this.fd, this.fd + len);
        this.fd += len;
        return ret;
    }

    public ReadBufferNew(len: number) {
        let b_ = this.buf.subarray(this.fd, this.fd + len);
        let ret = Buffer.from(b_);
        this.fd += len;
        return ret;
    }

    public ReadBufferEnd(fd: number = this.fd) {
        let ret = this.buf.subarray(fd, this.buf.length);
        this.fd = this.buf.length;
        return ret;
    }

}
