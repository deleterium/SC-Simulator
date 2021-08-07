"use strict"

// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License

const utils = {
    unsigned2signed: function (unsigned) {
        unsigned %= 1n << 64n
        if (unsigned >= (1n << 63n) ) {
            return unsigned - (1n << 64n)
        }
        return unsigned
    },
    signed2unsigned: function (signed) {
        signed %= 18446744073709551616n
        if (signed < 0 ) {
            return signed + 18446744073709551616n
        }
        return signed
    },
    getNextInstructionLine: function (line) {
        let instr
        for( ;line <MachineState.sourceCode.length; line++) {
            instr = MachineState.sourceCode[line]
            if (    /^\s*$/.exec(instr) !== null
                 || /^\s*(\w+):\s*$/.exec(instr) !== null
                 || /^\s*\^.*/.exec(instr) !== null )
                continue
            break
        }
        return line
    },
    getRandom64bit: function () {
        return (BigInt(Math.floor(Math.random()*4294967296))<<32n)+BigInt(Math.floor(Math.random()*4294967296))
    },
    hexstring2messagearray: function (in_hexstr) {
        in_hexstr = in_hexstr.padEnd(64,"0")
        let ret = [ 0n, 0n, 0n, 0n ]
        let base, debug
        for (let i=0; i<64; i+=2) {
            if (i % 16 == 0) base = 1n
            else base *= 256n
            ret[parseInt(i/16,10)] += BigInt(parseInt(in_hexstr.slice(i, i+2),16)) * base
        }
        return ret
    },
    messagearray2hexstring: function (in_array) {
        let ret = "", val
        for (let i = 0n; i < 32n; i++) {
            val = (in_array[i/8n] >> ((i % 8n) * 8n)) & 0xffn
            ret += val.toString(16).padStart(2,"0")
        }
        return ret
    },
    messagearray2superregister: function (in_array) {
        let ret = 0n
        for (let i = 0, base = 1n; i < 4; i++) {
            ret += in_array[i] * base
            base <<= 64n
        }
        return ret
    },
    superregister2messagearray: function (in_superregister) {
        let ret = []
        if (in_superregister < 0n) {
            in_superregister += (1n << 256n)
        }
        for (let i = 0; i < 4; i++) {
            ret.push(in_superregister % 18446744073709551616n)
            in_superregister >>= 64n
        }
        return ret
    },
    long2string: function (in_long) {
        let hexstr = "", val
        for (let i = 0n; i < 8n; i++) {
            val = (in_long >> (i%8n)*8n) & 0xffn
            hexstr += val.toString(16).padStart(2,"0")
        }
        return this.hexstring2string(hexstr)
    },
    long2stringBalance: function (bigintVar) {
        var digits = bigintVar.toString(10).split("").reverse()
        let outp=[]
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
    },
    string2hexstring: function (in_str) {
        if ( !(typeof in_str === 'string' || in_str instanceof String) ){
            return undefined;
        }
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
    },
    hexstring2string: function(in_hexstr) {
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
    },
    minus1: 18446744073709551615n,
    pow2to64: 18446744073709551616n,
}
