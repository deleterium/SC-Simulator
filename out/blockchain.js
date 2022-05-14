import { utils } from './utils.js';
export class BLOCKCHAIN {
    constructor() {
        this.txHeight = 0n;
        this.currentBlock = 1;
        this.accounts = [];
        this.transactions = [];
        this.maps = [];
    }
    /**
     * Adds transactions from an array of objects to the blockchain. Only adds
     * tx for current block height.
     *
     * @param TXarray Array of TX objects created by user
     */
    addTransactions(TXarray) {
        TXarray.forEach(curTX => {
            if (curTX.blockheight !== this.currentBlock) {
                return;
            }
            if (curTX.tokens === undefined) {
                curTX.tokens = [];
            }
            // Process balance for sender account
            this.addBalanceTo(curTX.sender, -curTX.amount);
            // Process balance for recipient account
            this.addBalanceTo(curTX.recipient, curTX.amount);
            // Process tokens transfers
            curTX.tokens.forEach(Tkn => {
                this.addTokensTo(curTX.sender, Tkn.asset, -Tkn.quantity);
                this.addTokensTo(curTX.recipient, Tkn.asset, Tkn.quantity);
            });
            // Calculate timestamp
            this.txHeight++;
            const timestamp = (BigInt(curTX.blockheight) << 32n) + this.txHeight;
            // Create urandom txid
            const txid = utils.getRandom64bit();
            // Process message payload to messageArr
            let txhexstring = '';
            if (curTX.messageText !== undefined) {
                txhexstring = utils.string2hexstring(curTX.messageText);
            }
            else if (curTX.messageHex !== undefined) {
                txhexstring = curTX.messageHex;
            }
            let expectedType = 0; // Ordinary payment
            if (curTX.tokens.length !== 0) {
                expectedType = 2; // Token transfer
            }
            else if (curTX.amount === 0n && (curTX.messageHex || curTX.messageText)) {
                expectedType = 1; // Arbitrary message
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
            });
        });
    }
    /**
     * Adds balance to an account.
     *
     * @param account BigInt Numeric account
     *
     * @param amount BigInt Amount to be added (can be negative)
     */
    addBalanceTo(account, amount) {
        const foundAccount = this.getAccountFromId(account);
        foundAccount.balance += amount;
    }
    /**
     * Adds tokens to an account.
     *
     * @param account BigInt Numeric account
     * @param asset BigInt Asset to be added
     * @param quantity BigInt Quantity QNT to be added (can be negative)
     */
    addTokensTo(account, asset, quantity) {
        const foundAccount = this.getAccountFromId(account);
        const foundAsset = foundAccount.tokens.find(tkn => tkn.asset === asset);
        if (foundAsset === undefined) {
            foundAccount.tokens.push({ asset, quantity });
            return;
        }
        foundAsset.quantity += quantity;
    }
    /**
     *
     * @param id Account id to search
     * @returns account found or one newly created
     */
    getAccountFromId(id) {
        const Acc = this.accounts.find(acc => acc.id === id);
        if (Acc === undefined) {
            const newitem = this.accounts.push({ id: id, balance: 0n, tokens: [] });
            return this.accounts[newitem - 1];
        }
        return Acc;
    }
    /**
     *
     * @param asset Asset id to query
     * @param minAmount Minimum amount to be included in results
     * @returns Array with userId and AssetQuantity that matches the query
     */
    getAllHolders(asset, minAmount) {
        const allHolders = this.accounts.reduce((previous, currAccount) => {
            if (currAccount.id === 0n) {
                // skip burn address
                return previous;
            }
            const foundAsset = currAccount.tokens.find(tkn => tkn.asset === asset && tkn.quantity !== 0n && tkn.quantity >= minAmount);
            if (foundAsset) {
                previous.push([currAccount.id, foundAsset.quantity]);
            }
            return previous;
        }, []);
        return allHolders;
    }
    /**
     *
     * @param id Account id to search
     * @param asset Asset id to search
     * @returns asset found or one newly created
     */
    getAssetFromId(id, asset) {
        const foundAccount = this.getAccountFromId(id);
        const foundAsset = foundAccount.tokens.find(tkn => tkn.asset === asset);
        if (foundAsset === undefined) {
            const newitem = foundAccount.tokens.push({ asset, quantity: 0n });
            return foundAccount.tokens[newitem - 1];
        }
        return foundAsset;
    }
    /**
    *
    * @param asset Asset id to search
    * @returns Total amount of QNT circulating
    */
    getAssetCirculating(asset) {
        return this.accounts.reduce((previous, currAccount) => {
            if (currAccount.id === 0n) {
                // Ignore burned tokens at id 0
                return previous;
            }
            const currAssetQNT = currAccount.tokens.reduce((prev, tkn) => {
                if (tkn.asset === asset) {
                    return tkn.quantity;
                }
                return prev;
            }, 0n);
            return previous + currAssetQNT;
        }, 0n);
    }
    /**
    *
    * @param asset Asset id to search
    * @param mininum Minimum quantity to have in account
    * @returns Number of accounts that match query
    */
    getAssetHoldersCount(asset, mininum) {
        return this.accounts.reduce((previous, currAccount) => {
            if (currAccount.id === 0n) {
                // Ignore burned tokens at id 0
                return previous;
            }
            const hasAsset = currAccount.tokens.find(tkn => tkn.asset === asset && tkn.quantity !== 0n && tkn.quantity >= mininum);
            return previous + (hasAsset ? 1n : 0n);
        }, 0n);
    }
    /**
     *
     * @param id Account id to search
     * @returns map found for the given id
     */
    getMapFromId(id) {
        return this.maps.find(Map => Map.id === id);
    }
    /**
     *
     * @param id Account id to get balance
     * @returns Its balance. If account does not exists, it is NOT created
     */
    getBalanceFrom(id) {
        const Acc = this.accounts.find(acc => acc.id === id);
        if (Acc === undefined)
            return 0n;
        else
            return Acc.balance;
    }
    /**
     *
     * @param id Account id
     * @param asset Asset id to query
     * @returns Its token quantity. If account does not exists or quantity is not defined, zero is returned
     */
    getTokenQuantityFrom(id, asset) {
        const foundAccount = this.accounts.find(acc => acc.id === id);
        if (foundAccount === undefined) {
            return 0n;
        }
        const foundAsset = foundAccount.tokens.find(tkn => tkn.asset === asset);
        return foundAsset?.quantity ?? 0n;
    }
    /**
     *
     * @param txid txid to search
     * @returns The BlockchainTransactionObj or undefined if no one found
     */
    getTxFrom(txid) {
        return this.transactions.find(TX => TX.txid === txid);
    }
    getTxAfterTimestamp(tstamp, accoundId, minAmount) {
        return this.transactions.find(TX => TX.recipient === accoundId &&
            TX.timestamp > tstamp && TX.amount >= minAmount &&
            TX.blockheight < this.currentBlock);
    }
    /**
     * Update states for a new block
     */
    forgeBlock() {
        this.currentBlock++;
        this.txHeight = 0n;
    }
}
