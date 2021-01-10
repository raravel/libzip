import fs from 'fs';
import { SIZE } from './data-type';

export default class StreamBuffer {
	private fd: number = 0;

	constructor(public buf: Buffer = Buffer.from('')) {

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

	private __size_check(size: SIZE) {
		if ( this.fd + size >= this.buf.length ) {
			const buf = Buffer.alloc(this.fd + size);
			this.buf.copy(buf, 0, 0, this.buf.length);
			this.buf = buf;
		}
	}

	public ReadUint8() {
		let ret = 0;
		ret = this.buf.readUInt8(this.fd);
		this.fd += SIZE.UINT8;
		return ret;
	}

	public WriteUint8(val: number) {
		this.__size_check(SIZE.UINT8);
		this.buf.writeUInt8(val, this.fd);
		this.fd += SIZE.UINT8;
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

	public WriteUint16(val: number, use_be: boolean = false) {
		this.__size_check(SIZE.UINT16);
		if ( use_be ) {
			this.buf.writeUInt16BE(val, this.fd);
		} else {
			this.buf.writeUInt16LE(val, this.fd);
		}
		this.fd += SIZE.UINT16;
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

	public WriteUint32(val: number, use_be: boolean = false) {
		this.__size_check(SIZE.UINT32);
		if ( use_be ) {
			this.buf.writeUInt32BE(val, this.fd);
		} else {
			this.buf.writeUInt32LE(val, this.fd);
		}
		this.fd += SIZE.UINT32;
	}

	public ReadString(len: number) {
		const b_ = this.buf.subarray(this.fd, this.fd + len);
		let ret = '';
		ret = b_.toString();
		this.fd += len;
		return ret;
	}

	public WriteString(val: string, encoding?: 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex') {
		this.__size_check(val.length);
		this.buf.write(val, this.fd, encoding);
		this.fd += val.length;
	}

	public ReadBuffer(len: number) {
		const ret = this.buf.subarray(this.fd, this.fd + len);
		this.fd += len;
		return ret;
	}

	public WriteBuffer(val: Buffer) {
		this.__size_check(val.length);
		for ( const v of val ) {
			this.buf[this.fd] = v;
			this.fd++;
		}
	}

	public ReadBufferNew(len: number) {
		const b_ = this.buf.subarray(this.fd, this.fd + len);
		const ret = Buffer.from(b_);
		this.fd += len;
		return ret;
	}

	public ReadBufferEnd(fd: number = this.fd) {
		const ret = this.buf.subarray(fd, this.buf.length);
		this.fd = this.buf.length;
		return ret;
	}

}
