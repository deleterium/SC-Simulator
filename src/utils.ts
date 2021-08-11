// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License


export class utils {

    static unsigned2signed(unsigned: bigint): bigint {
        unsigned %= 1n << 64n
        if (unsigned >= (1n << 63n) ) {
            return unsigned - (1n << 64n)
        }
        return unsigned
    }
    static signed2unsigned(signed: bigint): bigint {
        signed %= 18446744073709551616n
        if (signed < 0 ) {
            return signed + 18446744073709551616n
        }
        return signed
    }
    static getRandom64bit(): bigint {
        return (BigInt(Math.floor(Math.random()*4294967296))<<32n)+BigInt(Math.floor(Math.random()*4294967296))
    }
    static hexstring2messagearray(in_hexstr: string): bigint[] {
        in_hexstr = in_hexstr.padEnd(64,"0")
        let ret = [ 0n, 0n, 0n, 0n ]
        let base=1n
        for (let i=0n; i<64n; i+=2n) {
            if (i % 16n == 0n) base = 1n
            else base *= 256n
            ret[Number(i/16n)] += BigInt(Number("0x"+in_hexstr.slice(Number(i), Number(i+2n)))) * base
        }
        return ret
    }
    static messagearray2hexstring(in_array: bigint[]): string {
        let ret = "", val
        for (let i = 0n; i < 32n; i++) {
            val = (in_array[Number(i/8n)] >> ((i % 8n) * 8n)) & 0xffn
            ret += val.toString(16).padStart(2,"0")
        }
        return ret
    }
    static messagearray2superregister(in_array: bigint[]): bigint {
        let ret = 0n
        for (let i = 0, base = 1n; i < 4; i++) {
            ret += in_array[i] * base
            base <<= 64n
        }
        return ret
    }
    static superregister2messagearray(in_superregister: bigint): [bigint, bigint, bigint, bigint ] {
        let ret: [bigint, bigint, bigint, bigint ] = [ 0n, 0n, 0n, 0n]
        if (in_superregister < 0n) {
            in_superregister += (1n << 256n)
        }
        for (let i = 0; i < 4; i++) {
            ret.push(in_superregister % 18446744073709551616n)
            in_superregister >>= 64n
        }
        return ret
    }
    static long2string(in_long: bigint): string {
        let hexstr = "", val
        for (let i = 0n; i < 8n; i++) {
            val = (in_long >> (i%8n)*8n) & 0xffn
            hexstr += val.toString(16).padStart(2,"0")
        }
        return this.hexstring2string(hexstr)
    }
    static long2stringBalance(bigintVar: bigint) {
        var digits = bigintVar.toString(10).split("").reverse()
        let outp :string[] = []
        let diglen = digits.length
        if (bigintVar < 0) diglen--
        if (diglen > 4) {
            outp=outp.concat(digits.slice(0,4))
            outp.push("_")
            if (diglen > 8) {
                outp=outp.concat(digits.slice(4,8))
                outp.push("_")
                outp=outp.concat(digits.slice(8))
            } else {
                outp=outp.concat(digits.slice(4))
            }
        } else {
            outp=outp.concat(digits.slice(0))
        }
        return outp.reverse().join("")
    }
    static string2hexstring(in_str: string) {
        var byarr = [];
        var ret = "";
        var c,c1, i, j;
        for (i=0; i<in_str.length; i++) {
            c = in_str.charCodeAt(i);
            if (c < 128) {
                byarr.push(c);
            } else {
                if (c < 2048) {
                    byarr.push(c>>6 | 0xc0);    //ok
                    byarr.push((c & 63) | 128); //ok
                } else {
                    if (c < 55296 || c > 57343) {
                        byarr.push(((c >> 12 ) & 63) | 0xe0); //ok
                        byarr.push(((c >> 6 ) & 63) | 128); //ok
                        byarr.push((c & 63) | 128); //ok
                    } else {
                        i++;
                        c1 = in_str.charCodeAt(i);
                        if ((c & 0xFC00) == 0xd800 && (c1 & 0xFC00) == 0xDC00) {
                            c = ((c & 0x3FF) << 10) + (c1 & 0x3FF) + 0x10000;
                            byarr.push(((c >> 18 ) & 63) | 0xf0); //ok
                            byarr.push(((c >> 12 ) & 63) | 128); //ok
                            byarr.push(((c >> 6 ) & 63) | 128); //ok
                            byarr.push((c & 63) | 128); //ok
                        }
                    }
                }
            }
        }
        for (j=0; j<byarr.length; j++){
            ret+=byarr[j].toString(16).padStart(2, '0');
        }
        return(ret.padEnd(64,"0"));
    }
    static hexstring2string(in_hexstr: string) {
        let c1, c2, c3, c4, cc
        let i=0, ret = ""
        do {
            if (i >= in_hexstr.length) {
                return ret
            }
            c1 = parseInt(in_hexstr.slice(i, i+2),16)
            i += 2
            if ( c1 < 128 ) {
                if (c1 >= 32) {
                    ret+=String.fromCharCode(c1)
                }
                continue
            }
            if ((c1 & 0xE0) == 0xC0) { //twobytes utf8
                if (i >= in_hexstr.length) {
                    return ret
                }
                c2 = parseInt(in_hexstr.slice(i, i+2),16)
                i += 2
                if ((c2 & 0xC0) == 0x80) {
                    ret+=String.fromCharCode( (c2 & 0x3F) | ((c1 & 0x1F) << 6))
                }
                continue
            }
            if ((c1 & 0xF0) == 0xE0) { //threebytes utf8
                if (i+2 >= in_hexstr.length) {
                    return ret
                }
                c2 = parseInt(in_hexstr.slice(i, i+2),16)
                i += 2
                c3 = parseInt(in_hexstr.slice(i, i+2),16)
                i += 2
                if (((c2 & 0xC0) == 0x80) && ((c3 & 0xC0) == 0x80)) {
                    ret+=String.fromCharCode( (c3 & 0x3F) | ((c2 & 0x3F) << 6) | ((c1 & 0xF) << 12))
                }
                continue
            }
            if ((c1 & 0xF8) == 0xF0) { //fourbytes utf8
                if (i+4 >= in_hexstr.length){
                    return ret
                }
                c2 = parseInt(in_hexstr.slice(i, i+2),16)
                i += 2
                c3 = parseInt(in_hexstr.slice(i, i+2),16)
                i += 2
                c4 = parseInt(in_hexstr.slice(i, i+2),16)
                i += 2
                if (((c2 & 0xC0) == 0x80) && ((c3 & 0xC0) == 0x80) && ((c4 & 0xC0) == 0x80)) {
                    cc = (c4 & 0x3F) | ((c3 & 0x3F) << 6) | ((c2 & 0x3F) << 12) | ((c1 & 0x7) << 18)
                    cc-= 0x10000
                    ret+=String.fromCharCode( (cc >> 10) | 0xd800 ) + String.fromCharCode( (cc & 0x3FF) | 0xDc00)
                }
                continue
            }
        } while (true)
    }
}
