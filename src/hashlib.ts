
// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License

/* LICENSE notes for functions binl_md5, binl_rmd160, binb_sha256:
 *
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

export class HashLib {
    private uLongsArr: bigint[] = [] // Contains an array of 64-bit unsigned BigInt
    private sWordsArr: number[] = [] // Contains an array of 32-bit signed Number

    constructor(public hashType: "MD5" | "RIPEMD160" | "SHA256") {
    }

    hash(arr: bigint[]): bigint[] {
        this.uLongsArr=arr
        if (this.hashType === "MD5") {
            return this.hashMD5()
        }
        if (this.hashType === "RIPEMD160") {
            return this.hashRIPEMD160()
        }
        if (this.hashType === "SHA256") {
            return this.hashSHA256()
        }
        return [ 0n ]
    }

    private hashMD5() {
        this.uLongsArr2sWordsArr()

        this.sWordsArr = this.binl_md5(this.sWordsArr, 4 * 8 * this.sWordsArr.length)

        let aa= this.signed2unsigned(BigInt(this.sWordsArr[0]))
        let bb= this.signed2unsigned(BigInt(this.sWordsArr[1]))
        let cc= this.signed2unsigned(BigInt(this.sWordsArr[2]))
        let dd= this.signed2unsigned(BigInt(this.sWordsArr[3]))

        return [(bb << 32n) + aa, (dd << 32n) + cc]
    }

    private hashRIPEMD160() {
        this.uLongsArr2sWordsArr()

        this.sWordsArr = this.binl_rmd160(this.sWordsArr, 4 * 8 * this.sWordsArr.length)

        let aa= this.signed2unsigned(BigInt(this.sWordsArr[0]))
        let bb= this.signed2unsigned(BigInt(this.sWordsArr[1]))
        let cc= this.signed2unsigned(BigInt(this.sWordsArr[2]))
        let dd= this.signed2unsigned(BigInt(this.sWordsArr[3]))
        let ee= this.signed2unsigned(BigInt(this.sWordsArr[4]))

        return [(bb << 32n) + aa, (dd << 32n) + cc, ee]
    }

    private hashSHA256() {
        this.uLongsArr2sWordsArr()

        this.sWordsArrToggleEndian()
        this.sWordsArr = this.binb_sha256(this.sWordsArr, 4 * 8 * this.sWordsArr.length)
        this.sWordsArrToggleEndian()

        let aa= this.signed2unsigned(BigInt(this.sWordsArr[0]))
        let bb= this.signed2unsigned(BigInt(this.sWordsArr[1]))
        let cc= this.signed2unsigned(BigInt(this.sWordsArr[2]))
        let dd= this.signed2unsigned(BigInt(this.sWordsArr[3]))
        let ee= this.signed2unsigned(BigInt(this.sWordsArr[4]))
        let ff= this.signed2unsigned(BigInt(this.sWordsArr[5]))
        let gg= this.signed2unsigned(BigInt(this.sWordsArr[6]))
        let hh= this.signed2unsigned(BigInt(this.sWordsArr[7]))

        return [(bb << 32n) + aa, (dd << 32n) + cc, (ff << 32n) + ee, (hh << 32n) + gg]
    }

    private sWordsArrToggleEndian() {
        let bi = this.sWordsArr.map(x => this.signed2unsigned(BigInt(x)))
        let worarr = [], val
        for (let i = 0; i < bi.length; i++) {
            val  =  (bi[i] >> 24n) & 0xffn
            val |= ((bi[i] >> 16n) & 0xffn) << 8n
            val |= ((bi[i] >>  8n) & 0xffn) << 16n
            val |=  (bi[i]         & 0xffn) << 24n
            worarr.push( Number( this.unsigned2signed( val ) ) )
        }
        this.sWordsArr=worarr
    }

    private uLongsArr2sWordsArr() {
        let worarr = [], val
        for (let i = 0n; i < this.uLongsArr.length * 2; i++) {
            val = (this.uLongsArr[ Number(i/2n) ] >> ( (i%2n) * 32n)) & 0xffffffffn
            worarr.push( Number( this.unsigned2signed( val ) ) )
        }
        this.sWordsArr=worarr
    }

    // For 32-bit BigInt
    private unsigned2signed(unsigned: bigint) {
        if (unsigned >= 0x80000000n ) {
            return unsigned - 0x100000000n
        }
        return unsigned
    }

    // For 32-bit BigInt
    private signed2unsigned(signed: bigint) {
        if (signed < 0n ) {
            return (signed + 0x100000000n)
        }
        return signed
    }

    /* Calculate the MD5 of an array of little-endian words, and a bit length. */
    private binl_md5(x: number[], len: number) {
        /* These functions implement the basic operations the algorithm uses. */
        function md5_cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
            return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b)
        }
        function md5_ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
            return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t)
        }
        function md5_gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
            return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t)
        }
        function md5_hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
            return md5_cmn(b ^ c ^ d, a, b, x, s, t);
        }
        function md5_ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
            return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
        }
        /* Add integers, wrapping at 2^32. This uses 16-bit operations internally
        *  to work around bugs in some JS interpreters. */
        function safe_add(x: number, y: number) {
            var lsw = (x & 0xFFFF) + (y & 0xFFFF)
            var msw = (x >> 16) + (y >> 16) + (lsw >> 16)
            return (msw << 16) | (lsw & 0xFFFF)
        }
        /* Bitwise rotate a 32-bit number to the left. */
        function bit_rol(num: number, cnt: number) {
            return (num << cnt) | (num >>> (32 - cnt));
        }
        /* MD5 main algorithm
        /* append padding */
        x[len >> 5] |= 0x80 << ((len) % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;

        var a =  1732584193;
        var b = -271733879;
        var c = -1732584194;
        var d =  271733878;

        for(var i = 0; i < x.length; i += 16) {
            var olda = a;
            var oldb = b;
            var oldc = c;
            var oldd = d;

            a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
            d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
            c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
            b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
            a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
            d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
            c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
            b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
            a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
            d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
            c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
            b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
            a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
            d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
            c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
            b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

            a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
            d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
            c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
            b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
            a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
            d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
            c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
            b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
            a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
            d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
            c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
            b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
            a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
            d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
            c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
            b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

            a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
            d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
            c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
            b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
            a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
            d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
            c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
            b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
            a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
            d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
            c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
            b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
            a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
            d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
            c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
            b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

            a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
            d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
            c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
            b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
            a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
            d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
            c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
            b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
            a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
            d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
            c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
            b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
            a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
            d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
            c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
            b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

            a = safe_add(a, olda);
            b = safe_add(b, oldb);
            c = safe_add(c, oldc);
            d = safe_add(d, oldd);
        }

        return [ a, b, c, d ];
    }

    /* Calculate the RIPE-MD160 of an array of little-endian words, and a bit length. */
    private binl_rmd160(x: number[], len: number) {
        /* These functions implement the basic operations the algorithm uses. */
        function rmd160_f(j: number, x: number, y: number, z: number) {
            if (j>79) {
                throw new Error("rmd160_f: j out of range");
            }
            return ( 0 <= j && j <= 15) ? (x ^ y ^ z) :
                    (16 <= j && j <= 31) ? (x & y) | (~x & z) :
                    (32 <= j && j <= 47) ? (x | ~y) ^ z :
                    (48 <= j && j <= 63) ? (x & z) | (y & ~z) :
                    x ^ (y | ~z);
        }
        function rmd160_K1(j: number) {
            if (j>79) {
                throw new Error("rmd160_K1: j out of range");
            }
            return ( 0 <= j && j <= 15) ? 0x00000000 :
                    (16 <= j && j <= 31) ? 0x5a827999 :
                    (32 <= j && j <= 47) ? 0x6ed9eba1 :
                    (48 <= j && j <= 63) ? 0x8f1bbcdc :
                    0xa953fd4e;
            }
        function rmd160_K2(j: number) {
            if (j>79) {
                throw new Error("rmd160_K2: j out of range");
            }
            return ( 0 <= j && j <= 15) ? 0x50a28be6 :
                    (16 <= j && j <= 31) ? 0x5c4dd124 :
                    (32 <= j && j <= 47) ? 0x6d703ef3 :
                    (48 <= j && j <= 63) ? 0x7a6d76e9 :
                    0x00000000;
        }
        var rmd160_r1 = [
            0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
            7,  4, 13,  1, 10,  6, 15,  3, 12,  0,  9,  5,  2, 14, 11,  8,
            3, 10, 14,  4,  9, 15,  8,  1,  2,  7,  0,  6, 13, 11,  5, 12,
            1,  9, 11, 10,  0,  8, 12,  4, 13,  3,  7, 15, 14,  5,  6,  2,
            4,  0,  5,  9,  7, 12,  2, 10, 14,  1,  3,  8, 11,  6, 15, 13
        ];
        var rmd160_r2 = [
            5, 14,  7,  0,  9,  2, 11,  4, 13,  6, 15,  8,  1, 10,  3, 12,
            6, 11,  3,  7,  0, 13,  5, 10, 14, 15,  8, 12,  4,  9,  1,  2,
            15,  5,  1,  3,  7, 14,  6,  9, 11,  8, 12,  2, 10,  0,  4, 13,
            8,  6,  4,  1,  3, 11, 15,  0,  5, 12,  2, 13,  9,  7, 10, 14,
            12, 15, 10,  4,  1,  5,  8,  7,  6,  2, 13, 14,  0,  3,  9, 11
        ];
        var rmd160_s1 = [
            11, 14, 15, 12,  5,  8,  7,  9, 11, 13, 14, 15,  6,  7,  9,  8,
            7,  6,  8, 13, 11,  9,  7, 15,  7, 12, 15,  9, 11,  7, 13, 12,
            11, 13,  6,  7, 14,  9, 13, 15, 14,  8, 13,  6,  5, 12,  7,  5,
            11, 12, 14, 15, 14, 15,  9,  8,  9, 14,  5,  6,  8,  6,  5, 12,
            9, 15,  5, 11,  6,  8, 13, 12,  5, 12, 13, 14, 11,  8,  5,  6
        ];
        var rmd160_s2 = [
            8,  9,  9, 11, 13, 15, 15,  5,  7,  7,  8, 11, 14, 14, 12,  6,
            9, 13, 15,  7, 12,  8,  9, 11,  7,  7, 12,  7,  6, 15, 13, 11,
            9,  7, 15, 11,  8,  6,  6, 14, 12, 13,  5, 14, 13, 13,  7,  5,
            15,  5,  8, 11, 14, 14,  6, 14,  6,  9, 12,  9, 12,  5, 15,  8,
            8,  5, 12,  9, 12,  5, 14,  6,  8, 13,  6,  5, 15, 13, 11, 11
        ];

        /*
        * Add integers, wrapping at 2^32. This uses 16-bit operations internally
        * to work around bugs in some JS interpreters.
        */
        function safe_add(x: number, y: number) {
            var lsw = (x & 0xFFFF) + (y & 0xFFFF);
            var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xFFFF);
        }

        /*
        * Bitwise rotate a 32-bit number to the left.
        */
        function bit_rol(num: number, cnt: number) {
            return (num << cnt) | (num >>> (32 - cnt));
        }

        /* RIPEMD160 main algorithm
        /* append padding */
        x[len >> 5] |= 0x80 << (len % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;

        var h0 = 0x67452301;
        var h1 = 0xefcdab89;
        var h2 = 0x98badcfe;
        var h3 = 0x10325476;
        var h4 = 0xc3d2e1f0;

        for (var i = 0; i < x.length; i += 16) {
            var T;
            var A1 = h0, B1 = h1, C1 = h2, D1 = h3, E1 = h4;
            var A2 = h0, B2 = h1, C2 = h2, D2 = h3, E2 = h4;
            for (var j = 0; j <= 79; ++j) {
                T = safe_add(A1, rmd160_f(j, B1, C1, D1));
                T = safe_add(T, x[i + rmd160_r1[j]]);
                T = safe_add(T, rmd160_K1(j));
                T = safe_add(bit_rol(T, rmd160_s1[j]), E1);
                A1 = E1; E1 = D1; D1 = bit_rol(C1, 10); C1 = B1; B1 = T;
                T = safe_add(A2, rmd160_f(79-j, B2, C2, D2));
                T = safe_add(T, x[i + rmd160_r2[j]]);
                T = safe_add(T, rmd160_K2(j));
                T = safe_add(bit_rol(T, rmd160_s2[j]), E2);
                A2 = E2; E2 = D2; D2 = bit_rol(C2, 10); C2 = B2; B2 = T;
            }
            T = safe_add(h1, safe_add(C1, D2));
            h1 = safe_add(h2, safe_add(D1, E2));
            h2 = safe_add(h3, safe_add(E1, A2));
            h3 = safe_add(h4, safe_add(A1, B2));
            h4 = safe_add(h0, safe_add(B1, C2));
            h0 = T;
        }
        return [h0, h1, h2, h3, h4];
    }

    /* Calculate the SHA-256 of an array of big-endian words, and a bit length. */
    private binb_sha256(m: number[], l: number){
        function safe_add (x: number, y: number) {
            var lsw = (x & 0xFFFF) + (y & 0xFFFF);
            var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xFFFF);
        }
        /* sha256 support functions */
        function sha256_S (X: number, n: number) {return ( X >>> n ) | (X << (32 - n));}
        function sha256_R (X: number, n: number) {return ( X >>> n );}
        function sha256_Ch(x: number, y: number, z: number) {return ((x & y) ^ ((~x) & z));}
        function sha256_Maj(x: number, y: number, z: number) {return ((x & y) ^ (x & z) ^ (y & z));}
        function sha256_Sigma0256(x: number) {return (sha256_S(x, 2) ^ sha256_S(x, 13) ^ sha256_S(x, 22));}
        function sha256_Sigma1256(x: number) {return (sha256_S(x, 6) ^ sha256_S(x, 11) ^ sha256_S(x, 25));}
        function sha256_Gamma0256(x: number) {return (sha256_S(x, 7) ^ sha256_S(x, 18) ^ sha256_R(x, 3));}
        function sha256_Gamma1256(x: number) {return (sha256_S(x, 17) ^ sha256_S(x, 19) ^ sha256_R(x, 10));}
        /* Main sha256 function */
        var sha256_K = new Array (
            1116352408, 1899447441, -1245643825, -373957723, 961987163, 1508970993,
            -1841331548, -1424204075, -670586216, 310598401, 607225278, 1426881987,
            1925078388, -2132889090, -1680079193, -1046744716, -459576895, -272742522,
            264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986,
            -1740746414, -1473132947, -1341970488, -1084653625, -958395405, -710438585,
            113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
            1695183700, 1986661051, -2117940946, -1838011259, -1564481375, -1474664885,
            -1035236496, -949202525, -778901479, -694614492, -200395387, 275423344,
            430227734, 506948616, 659060556, 883997877, 958139571, 1322822218,
            1537002063, 1747873779, 1955562222, 2024104815, -2067236844, -1933114872,
            -1866530822, -1538233109, -1090935817, -965641998
        );

        var HASH = new Array(1779033703, -1150833019, 1013904242, -1521486534,
                            1359893119, -1694144372, 528734635, 1541459225);
        var W = new Array(64);
        var a, b, c, d, e, f, g, h;
        var i, j, T1, T2;

        /* append padding */
        m[l >> 5] |= 0x80 << (24 - l % 32);
        m[((l + 64 >> 9) << 4) + 15] = l;

        for(i = 0; i < m.length; i += 16)
        {
            a = HASH[0];
            b = HASH[1];
            c = HASH[2];
            d = HASH[3];
            e = HASH[4];
            f = HASH[5];
            g = HASH[6];
            h = HASH[7];

            for(j = 0; j < 64; j++)
            {
                if (j < 16) {
                    W[j] = m[j + i];
                } else {
                    W[j] = safe_add(safe_add(safe_add(sha256_Gamma1256(W[j - 2]), W[j - 7]),
                                                        sha256_Gamma0256(W[j - 15])), W[j - 16]);
                }

                T1 = safe_add(safe_add(safe_add(safe_add(h, sha256_Sigma1256(e)), sha256_Ch(e, f, g)),
                                                                    sha256_K[j]), W[j]);
                T2 = safe_add(sha256_Sigma0256(a), sha256_Maj(a, b, c));
                h = g;
                g = f;
                f = e;
                e = safe_add(d, T1);
                d = c;
                c = b;
                b = a;
                a = safe_add(T1, T2);
            }

            HASH[0] = safe_add(a, HASH[0]);
            HASH[1] = safe_add(b, HASH[1]);
            HASH[2] = safe_add(c, HASH[2]);
            HASH[3] = safe_add(d, HASH[3]);
            HASH[4] = safe_add(e, HASH[4]);
            HASH[5] = safe_add(f, HASH[5]);
            HASH[6] = safe_add(g, HASH[6]);
            HASH[7] = safe_add(h, HASH[7]);
        }
        return HASH;
    }
}
