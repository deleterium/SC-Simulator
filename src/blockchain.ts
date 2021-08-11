
import {utils} from './utils.js'

import {
    AccountObj,
    BlockchainTransactionObj,
    UserTransactionObj
} from './objTypes.js'

export class BLOCKCHAIN {

    txHeight: bigint
    currentBlock: number
    accounts: AccountObj[]
    transactions: BlockchainTransactionObj[]

    constructor() {
        this.txHeight = 0n
        this.currentBlock = 1
        this.accounts = []
        this.transactions = []
    }

    /**
     * Adds transactions from an array of objects to the blockchain. Only adds
     * tx for current block height.
     *
     * @param TXarray Array of TX objects created by user
     */
    addTransactions(TXarray: UserTransactionObj[]){
        TXarray.forEach( curTX => {

            if (curTX.blockheight != this.currentBlock) {
                return
            }
            //Process balance for sender account
            this.addBalanceTo(curTX.sender, -curTX.amount)
            //Process balance for recipient account
            this.addBalanceTo(curTX.recipient, curTX.amount)
            //Calculate timestamp
            this.txHeight++
            let timestamp = (BigInt(curTX.blockheight) << 32n) + this.txHeight
            //Create urandom txid
            let txid = utils.getRandom64bit()
            //Process message payload to messageArr
            let txhexstring=""
            if (curTX.messageText !== undefined) {
                txhexstring = utils.string2hexstring(curTX.messageText)
            } else if (curTX.messageHex !== undefined) {
                txhexstring = curTX.messageHex
            }
            let messageArr = 
            //pushes new TX object to blockchain array
            this.transactions.push({
                sender: curTX.sender,
                recipient: curTX.recipient,
                txid: txid,
                amount: curTX.amount,
                blockheight: curTX.blockheight,
                timestamp: timestamp,
                processed: false,
                messageArr: utils.hexstring2messagearray(txhexstring),
                messageText: curTX.messageText,
                messageHex: curTX.messageHex,
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
    addBalanceTo(account: bigint, amount: bigint) {
        let foundAccount = this.accounts.find(obj => obj.id == account)
        if (foundAccount === undefined) {
            this.accounts.push( { id: account, balance: amount })
        } else {
            foundAccount.balance += amount
        }
    }

    /**
     * 
     * @param id Account id to search
     * @returns account found or one newly created
     */
    getAccountFromId(id: bigint) {
        let Acc = this.accounts.find(acc => acc.id == id)
        if (Acc === undefined) {
            let newitem = this.accounts.push({ id: id, balance: 0n })
            return this.accounts[newitem - 1]
        }
        return Acc
    }

    /**
     * 
     * @param id Account id to get balance
     * @returns Its balance. If account does not exists, it is NOT created
     */
    getBalanceFrom(id: bigint) {
        let Acc = this.accounts.find(acc => acc.id == id)
        if (Acc === undefined) return 0n
        else return Acc.balance
    }

    /**
     * 
     * @param txid txid to search
     * @returns The BlockchainTransactionObj or undefined if no one found
     */
     getTxFrom(txid: bigint) {
        return this.transactions.find(TX => TX.txid == txid)
    }

    getTxAfterTimestamp(tstamp: bigint, accoundId: bigint, minAmount: bigint) {
        return this.transactions.find(TX => TX.recipient == accoundId
            && TX.timestamp > tstamp && TX.amount >= minAmount
            && TX.blockheight < this.currentBlock)
        
    }


    /**
     * Update states for a new block
     */
    forgeBlock() {
        this.currentBlock++
        this.txHeight = 0n
    }

}