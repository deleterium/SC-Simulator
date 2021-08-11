

// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License

import { CONTRACT } from "./contract.js";


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
 * Object for accounts stored in blockchain
 *
 * @member {bigint} id Account ID (64-bit unsigned)
 * @member {bigint} balance Account current balance (can be negative)
 */
 export interface AccountObj {
    id: bigint
    balance: bigint
}

/**
 * Object for transactions stored in blockchain
 *  @member {bigint} sender
 *  @member {bigint} recipient
 *  @member {bigint} txid
 *  @member {bigint} amount
 *  @member {number} blockheight
 *  @member {bigint} timestamp
 *  @member {bigint[]} messageArr
 *  @member {boolean} processed
 *  @member {? string} messageText
 *  @member {? string} messageHex max 64 chars hexadecimal
 */
export interface BlockchainTransactionObj {
    sender: bigint
    recipient: bigint
    txid: bigint
    amount: bigint
    blockheight: number
    timestamp: bigint
    messageArr: bigint[]
    processed: boolean
    messageText?: string
    messageHex?: string
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
    sender: bigint
    recipient: bigint
    amount: bigint
    blockheight: number
    messageText?: string
    messageHex?: string
}


/**
 * Object for transactions created by smart contracts
 *  @member {bigint} recipient
 *  @member {bigint} amount
 *  @member {bigint[4]} messageArr
 */
 export interface ContractTransactionObj {
    recipient: bigint
    amount: bigint
    messageArr: [ bigint, bigint, bigint, bigint ]
}


/**
 * Object types to use for API calls
 */
interface T_EXT {
    funName: string
    op_code: number
}
interface T_EXT_FUN extends T_EXT{
    execute(ContractState: CONTRACT): void
}
interface T_EXT_FUN_DAT extends T_EXT{
    execute(ContractState: CONTRACT, value: bigint): void
}
interface T_EXT_FUN_DAT_2 extends T_EXT{
    execute(ContractState: CONTRACT, value1: bigint, value2: bigint): void
}
interface T_EXT_FUN_RET extends T_EXT{
    execute(ContractState: CONTRACT): bigint
}
interface T_EXT_FUN_RET_DAT_2 extends T_EXT{
    execute(ContractState: CONTRACT, value1: bigint, value2: bigint): bigint
}