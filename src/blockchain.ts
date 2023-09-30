
import { utils } from './utils.js'

import { MapObj, Token, UserTransactionObj } from './objTypes.js'

/**
 * Object for accounts stored in blockchain
 *
 * @member {bigint} id Account ID (64-bit unsigned)
 * @member {bigint} balance Account current balance (can be negative)
 */
export interface AccountObj {
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
export interface BlockchainMapObj {
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
export interface BlockchainTransactionObj {
    blockheight: number
    sender: bigint
    recipient: bigint
    type: number
    txid: bigint
    amount: bigint
    tokens: Token[]
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

    reset () {
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
            if (curTX.tokens === undefined) {
                curTX.tokens = []
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
            if (curTX.txid === undefined) {
                curTX.txid = utils.getRandom64bit()
            }
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
                blockheight: curTX.blockheight,
                sender: curTX.sender,
                recipient: curTX.recipient,
                type: curTX.type ?? expectedType,
                txid: curTX.txid,
                amount: curTX.amount,
                tokens: curTX.tokens,
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
     * @param asset Asset id to query
     * @param minAmount Minimum amount to be included in results
     * @returns Array with userId and AssetQuantity that matches the query
     */
    getAllHolders (asset: bigint, minAmount: bigint): [bigint, bigint][] {
        const allHolders = this.accounts.reduce<[bigint, bigint][]>((previous, currAccount) => {
            if (currAccount.id === 0n) {
                // skip burn address
                return previous
            }
            const foundAsset = currAccount.tokens.find(tkn => tkn.asset === asset && tkn.quantity !== 0n && tkn.quantity >= minAmount)
            if (foundAsset) {
                previous.push([currAccount.id, foundAsset.quantity])
            }
            return previous
        }, [])
        return allHolders
    }

    /**
     *
     * @param id Account id to search
     * @param asset Asset id to search
     * @returns asset found or one newly created
     */
    getAssetFromId (id: bigint, asset: bigint) {
        const foundAccount = this.getAccountFromId(id)
        const foundAsset = foundAccount.tokens.find(tkn => tkn.asset === asset)
        if (foundAsset === undefined) {
            const newitem = foundAccount.tokens.push({ asset, quantity: 0n })
            return foundAccount.tokens[newitem - 1]
        }
        return foundAsset
    }

    /**
    *
    * @param asset Asset id to search
    * @returns Total amount of QNT circulating
    */
    getAssetCirculating (asset: bigint) {
        return this.accounts.reduce((previous, currAccount) => {
            if (currAccount.id === 0n) {
                // Ignore burned tokens at id 0
                return previous
            }
            const currAssetQNT = currAccount.tokens.reduce((prev, tkn) => {
                if (tkn.asset === asset) {
                    return tkn.quantity
                }
                return prev
            }, 0n)
            return previous + currAssetQNT
        }, 0n)
    }

    /**
    *
    * @param asset Asset id to search
    * @param mininum Minimum quantity to have in account
    * @returns Number of accounts that match query
    */
    getAssetHoldersCount (asset: bigint, mininum: bigint) {
        return this.accounts.reduce((previous, currAccount) => {
            if (currAccount.id === 0n) {
                // Ignore burned tokens at id 0
                return previous
            }
            const hasAsset = currAccount.tokens.find(
                tkn => tkn.asset === asset && tkn.quantity !== 0n && tkn.quantity >= mininum
            )
            return previous + (hasAsset ? 1n : 0n)
        }, 0n)
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
     * @param id Account id
     * @param asset Asset id to query
     * @returns Its token quantity. If account does not exists or quantity is not defined, zero is returned
     */
    getTokenQuantityFrom (id: bigint, asset: bigint) {
        const foundAccount = this.accounts.find(acc => acc.id === id)
        if (foundAccount === undefined) {
            return 0n
        }
        const foundAsset = foundAccount.tokens.find(tkn => tkn.asset === asset)
        return foundAsset?.quantity ?? 0n
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
