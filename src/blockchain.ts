
import { utils } from './utils.js'

import { MapObj, Token, UserTransactionObj } from './objTypes.js'

/**
 * Object for accounts stored in blockchain
 *
 * @member {bigint} id Account ID (64-bit unsigned)
 * @member {bigint} balance Account current balance (can be negative)
 */
interface AccountObj {
    id: bigint
    balance: bigint
    tokens: Token[]
}

/**
* Object for maps stored in blockchain
*
* @member {bigint} id Account ID (64-bit unsigned)
* @member {bigint} balance Account current balance (can be negative)
*/
interface BlockchainMapObj {
   id: bigint
   map: MapObj[]
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
interface BlockchainTransactionObj {
    type: number
    sender: bigint
    recipient: bigint
    txid: bigint
    amount: bigint
    tokens: Token[]
    blockheight: number
    timestamp: bigint
    messageArr: bigint[]
    processed: boolean
    messageText?: string
    messageHex?: string
}

export class BLOCKCHAIN {
    txHeight: bigint
    currentBlock: number
    accounts: AccountObj[]
    transactions: BlockchainTransactionObj[]
    maps: BlockchainMapObj[]

    constructor () {
        this.txHeight = 0n
        this.currentBlock = 1
        this.accounts = []
        this.transactions = []
        this.maps = []
    }

    /**
     * Adds transactions from an array of objects to the blockchain. Only adds
     * tx for current block height.
     *
     * @param TXarray Array of TX objects created by user
     */
    addTransactions (TXarray: UserTransactionObj[]) {
        TXarray.forEach(curTX => {
            if (curTX.blockheight !== this.currentBlock) {
                return
            }
            // Process balance for sender account
            this.addBalanceTo(curTX.sender, -curTX.amount)
            // Process balance for recipient account
            this.addBalanceTo(curTX.recipient, curTX.amount)
            // Process tokens transfers
            curTX.tokens.forEach(Tkn => {
                this.addTokensTo(curTX.sender, Tkn.asset, -Tkn.quantity)
                this.addTokensTo(curTX.recipient, Tkn.asset, Tkn.quantity)
            })
            // Calculate timestamp
            this.txHeight++
            const timestamp = (BigInt(curTX.blockheight) << 32n) + this.txHeight
            // Create urandom txid
            const txid = utils.getRandom64bit()
            // Process message payload to messageArr
            let txhexstring = ''
            if (curTX.messageText !== undefined) {
                txhexstring = utils.string2hexstring(curTX.messageText)
            } else if (curTX.messageHex !== undefined) {
                txhexstring = curTX.messageHex
            }
            let expectedType = 0 // Ordinary payment
            if (curTX.tokens.length !== 0) {
                expectedType = 2 // Token transfer
            } else if (curTX.amount === 0n && (curTX.messageHex || curTX.messageText)) {
                expectedType = 1 // Arbitrary message
            }

            // pushes new TX object to blockchain array
            this.transactions.push({
                type: curTX.type ?? expectedType,
                sender: curTX.sender,
                recipient: curTX.recipient,
                txid: txid,
                amount: curTX.amount,
                tokens: curTX.tokens,
                blockheight: curTX.blockheight,
                timestamp: timestamp,
                processed: false,
                messageArr: utils.hexstring2messagearray(txhexstring),
                messageText: curTX.messageText,
                messageHex: curTX.messageHex
            })
        })
    }

    /**
     * Adds balance to an account.
     *
     * @param account BigInt Numeric account
     *
     * @param amount BigInt Amount to be added (can be negative)
     */
    addBalanceTo (account: bigint, amount: bigint) {
        const foundAccount = this.getAccountFromId(account)
        foundAccount.balance += amount
    }

    /**
     * Adds tokens to an account.
     *
     * @param account BigInt Numeric account
     * @param asset BigInt Asset to be added
     * @param quantity BigInt Quantity QNT to be added (can be negative)
     */
    addTokensTo (account: bigint, asset: bigint, quantity: bigint) {
        const foundAccount = this.getAccountFromId(account)
        const foundAsset = foundAccount.tokens.find(tkn => tkn.asset === asset)
        if (foundAsset === undefined) {
            foundAccount.tokens.push({ asset, quantity })
            return
        }
        foundAsset.quantity += quantity
    }

    /**
     *
     * @param id Account id to search
     * @returns account found or one newly created
     */
    getAccountFromId (id: bigint) {
        const Acc = this.accounts.find(acc => acc.id === id)
        if (Acc === undefined) {
            const newitem = this.accounts.push({ id: id, balance: 0n, tokens: [] })
            return this.accounts[newitem - 1]
        }
        return Acc
    }

    /**
     *
     * @param id Account id to search
     * @returns map found for the given id
     */
    getMapFromId (id: bigint) {
        return this.maps.find(Map => Map.id === id)
    }

    /**
     *
     * @param id Account id to get balance
     * @returns Its balance. If account does not exists, it is NOT created
     */
    getBalanceFrom (id: bigint) {
        const Acc = this.accounts.find(acc => acc.id === id)
        if (Acc === undefined) return 0n
        else return Acc.balance
    }

    /**
     *
     * @param txid txid to search
     * @returns The BlockchainTransactionObj or undefined if no one found
     */
    getTxFrom (txid: bigint) {
        return this.transactions.find(TX => TX.txid === txid)
    }

    getTxAfterTimestamp (tstamp: bigint, accoundId: bigint, minAmount: bigint) {
        return this.transactions.find(TX => TX.recipient === accoundId &&
            TX.timestamp > tstamp && TX.amount >= minAmount &&
            TX.blockheight < this.currentBlock)
    }

    /**
     * Update states for a new block
     */
    forgeBlock () {
        this.currentBlock++
        this.txHeight = 0n
    }
}
