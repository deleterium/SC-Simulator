
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
 *  @member {number} blockheight
 *  @member {? string} messageText - Max 32 chars
 *  @member {? string} messageHex - If messageText is define, this is ignored. Max 64 chars hexadecimal
 */
export interface UserTransactionObj {
    type: number
    sender: bigint
    recipient: bigint
    amount: bigint
    tokens: Token[]
    blockheight: number
    messageText?: string
    messageHex?: string
}
