// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License

/**
 * Object for memory entries
 *
 * @member {string} varName Variable name defined in assembly
 * @member {bigint} value Variable value (64-bit unsigned)
 */
export interface MemoryObj {
    varName: string
    value: bigint
}

/**
 * Object for contract map
 *
 * @member {bigint} k1 key 1 (64-bit unsigned)
 * @member {bigint} k2 key 2 (64-bit unsigned)
 * @member {bigint} value Variable value (64-bit unsigned)
 */
export interface MapObj {
    k1: bigint
    k2: bigint
    value: bigint
}

/**
 * Object for Tokens
 *
 * @member {bigint} asset ID (64-bit unsigned)
 * @member {bigint} quantity QNT (64-bit unsigned)
 */
export interface Token {
    asset: bigint
    quantity: bigint
}

/**
 * Object for transactions created by user
 *  @member {bigint} sender
 *  @member {bigint} recipient
 *  @member {bigint} amount
 *  @member {number} blockheight - If undefined, will always be processed
 *  @member {? string} messageArr - Useful for contracts or sending methods
 *  @member {? string} messageText - Max 1000 bytes when utf-8 encoded
 *  @member {? string} messageHex - If messageText is define, this is ignored. Max 2000 chars hexadecimal
 */
export interface TransactionObj {
    txid?: bigint
    type?: number
    sender: bigint
    recipient: bigint
    amount: bigint
    tokens?: Token[]
    blockheight?: number
    messageArr?: bigint[]
    messageText?: string
    messageHex?: string
}

/**
 * Object for transactions created by smart contracts
 */
export interface ContractTransactionObj extends TransactionObj {
    type: number
    tokens: Token[]
    messageArr: bigint[]
}

/**
    @member {string} asmSourceCode - Mandatory. Assembly source code
    @member {? string} cSourceCode
    @member {? bigint} contractID
    @member {? bigint} creatorID
    @member {? number} dataPages
    @member {? number} userStackPages
    @member {? number} codeStackPages
    @member {? bigint} codeHashId
 */
export interface ContractDeployOptions {
    asmSourceCode: string
    cSourceCode?: string
    contractID?: bigint
    creatorID?: bigint
    dataPages?: number
    userStackPages?: number
    codeStackPages?: number
    codeHashId?: bigint
}
