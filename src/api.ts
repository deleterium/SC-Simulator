// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License

import { Blockchain, Constants, Contracts } from './index.js'
import { CONTRACT } from './contract.js'
import { HashLib } from './hashlib.js'
import { utils } from './utils.js'

interface T_EXT {
    funName: string
    opCode: number
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

export class API_MICROCODE {
    static EXT_FUN: T_EXT_FUN[] = [
        {
            funName: 'clear_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.A = [0n, 0n, 0n, 0n]
            }
        },
        {
            funName: 'clear_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.B = [0n, 0n, 0n, 0n]
            }
        },
        {
            funName: 'clear_A_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.A = [0n, 0n, 0n, 0n]
                ContractState.B = [0n, 0n, 0n, 0n]
            }
        },
        {
            funName: 'copy_A_From_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.A = [ContractState.B[0],
                    ContractState.B[1],
                    ContractState.B[2],
                    ContractState.B[3]]
            }
        },
        {
            funName: 'copy_B_From_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.B = [ContractState.A[0],
                    ContractState.A[1],
                    ContractState.A[2],
                    ContractState.A[3]]
            }
        },
        {
            funName: 'swap_A_and_B',
            opCode: 0x32,
            execute (ContractState) {
                const temp = [ContractState.B[0],
                    ContractState.B[1],
                    ContractState.B[2],
                    ContractState.B[3]]
                ContractState.B = [ContractState.A[0],
                    ContractState.A[1],
                    ContractState.A[2],
                    ContractState.A[3]]
                ContractState.A = [temp[0],
                    temp[1],
                    temp[2],
                    temp[3]]
            }
        },
        {
            funName: 'OR_A_with_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.A[0] |= ContractState.B[0]
                ContractState.A[1] |= ContractState.B[1]
                ContractState.A[2] |= ContractState.B[2]
                ContractState.A[3] |= ContractState.B[3]
            }
        },
        {
            funName: 'OR_B_with_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.B[0] |= ContractState.A[0]
                ContractState.B[1] |= ContractState.A[1]
                ContractState.B[2] |= ContractState.A[2]
                ContractState.B[3] |= ContractState.A[3]
            }
        },
        {
            funName: 'AND_A_with_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.A[0] &= ContractState.B[0]
                ContractState.A[1] &= ContractState.B[1]
                ContractState.A[2] &= ContractState.B[2]
                ContractState.A[3] &= ContractState.B[3]
            }
        },
        {
            funName: 'AND_B_with_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.B[0] &= ContractState.A[0]
                ContractState.B[1] &= ContractState.A[1]
                ContractState.B[2] &= ContractState.A[2]
                ContractState.B[3] &= ContractState.A[3]
            }
        },
        {
            funName: 'XOR_A_with_B',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.A[0] ^= ContractState.B[0]
                ContractState.A[1] ^= ContractState.B[1]
                ContractState.A[2] ^= ContractState.B[2]
                ContractState.A[3] ^= ContractState.B[3]
            }
        },
        {
            funName: 'XOR_B_with_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.B[0] ^= ContractState.A[0]
                ContractState.B[1] ^= ContractState.A[1]
                ContractState.B[2] ^= ContractState.A[2]
                ContractState.B[3] ^= ContractState.A[3]
            }
        },
        {
            funName: 'add_A_to_B',
            opCode: 0x32,
            execute (ContractState) {
                const a = utils.messagearray2superregister(ContractState.A)
                const b = utils.messagearray2superregister(ContractState.B)
                ContractState.B = utils.superregister2messagearray(a + b)
            }
        },
        {
            funName: 'add_B_to_A',
            opCode: 0x32,
            execute (ContractState) {
                const a = utils.messagearray2superregister(ContractState.A)
                const b = utils.messagearray2superregister(ContractState.B)
                ContractState.A = utils.superregister2messagearray(a + b)
            }
        },
        {
            funName: 'sub_A_from_B',
            opCode: 0x32,
            execute (ContractState) {
                const a = utils.messagearray2superregister(ContractState.A)
                const b = utils.messagearray2superregister(ContractState.B)
                ContractState.B = utils.superregister2messagearray(b - a)
            }
        },
        {
            funName: 'sub_B_from_A',
            opCode: 0x32,
            execute (ContractState) {
                const a = utils.messagearray2superregister(ContractState.A)
                const b = utils.messagearray2superregister(ContractState.B)
                ContractState.A = utils.superregister2messagearray(a - b)
            }
        },
        {
            funName: 'mul_A_by_B',
            opCode: 0x32,
            execute (ContractState) {
                const a = utils.messagearray2superregister(ContractState.A)
                const b = utils.messagearray2superregister(ContractState.B)
                ContractState.B = utils.superregister2messagearray(a * b)
            }
        },
        {
            funName: 'mul_B_by_A',
            opCode: 0x32,
            execute (ContractState) {
                const a = utils.messagearray2superregister(ContractState.A)
                const b = utils.messagearray2superregister(ContractState.B)
                ContractState.A = utils.superregister2messagearray(a * b)
            }
        },
        {
            funName: 'div_A_by_B',
            opCode: 0x32,
            execute (ContractState) {
                const a = utils.messagearray2superregister(ContractState.A)
                const b = utils.messagearray2superregister(ContractState.B)
                if (b === 0n) {
                    return
                }
                ContractState.B = utils.superregister2messagearray(a / b)
            }
        },
        {
            funName: 'div_B_by_A',
            opCode: 0x32,
            execute (ContractState) {
                const a = utils.messagearray2superregister(ContractState.A)
                const b = utils.messagearray2superregister(ContractState.B)
                if (a === 0n) {
                    return
                }
                ContractState.A = utils.superregister2messagearray(b / a)
            }
        },
        {
            funName: 'MD5_A_to_B',
            opCode: 0x32,
            execute (ContractState) {
                const MD5 = new HashLib('MD5')
                const md5hash = MD5.hash([ContractState.A[0], ContractState.A[1]])
                ContractState.B[0] = md5hash[0]
                ContractState.B[1] = md5hash[1]
            }
        },
        {
            funName: 'HASH160_A_to_B',
            opCode: 0x32,
            execute (ContractState) {
                const RIPE = new HashLib('RIPEMD160')
                const RIPEhash = RIPE.hash([ContractState.A[0], ContractState.A[1], ContractState.A[2], ContractState.A[3]])
                ContractState.B[0] = RIPEhash[0]
                ContractState.B[1] = RIPEhash[1]
                ContractState.B[2] = RIPEhash[2]
            }
        },
        {
            funName: 'SHA256_A_to_B',
            opCode: 0x32,
            execute (ContractState) {
                const SHA256 = new HashLib('SHA256')
                const SHA256hash = SHA256.hash([ContractState.A[0], ContractState.A[1], ContractState.A[2], ContractState.A[3]])
                ContractState.B[0] = SHA256hash[0]
                ContractState.B[1] = SHA256hash[1]
                ContractState.B[2] = SHA256hash[2]
                ContractState.B[3] = SHA256hash[3]
            }
        },
        {
            funName: 'put_Last_Block_Hash_In_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.A = [utils.getRandom64bit(),
                    utils.getRandom64bit(),
                    utils.getRandom64bit(),
                    utils.getRandom64bit()]
            }
        },
        {
            funName: 'message_from_Tx_in_A_to_B',
            opCode: 0x32,
            execute (ContractState) {
                const tx = Blockchain.transactions.find(TX => TX.recipient === ContractState.contract && TX.txid === ContractState.A[0])
                if (tx === undefined) {
                    ContractState.B = [0n, 0n, 0n, 0n]
                    return
                }
                const page = ContractState.A[1]
                const start = Number(page * 4n)
                for (let i = 0; i < 4; i++) {
                    if (tx.messageArr[start + i] === undefined) {
                        ContractState.B[i] = 0n
                    } else {
                        ContractState.B[i] = tx.messageArr[start + i]
                    }
                }
            }
        },
        {
            funName: 'B_to_Address_of_Tx_in_A',
            opCode: 0x32,
            execute (ContractState) {
                const tx = Blockchain.transactions.find(TX => TX.recipient === ContractState.contract && TX.txid === ContractState.A[0])
                ContractState.B = [0n, 0n, 0n, 0n]
                if (tx === undefined) {
                    return
                }
                ContractState.B[0] = tx.sender
            }
        },
        {
            funName: 'B_to_Address_of_Creator',
            opCode: 0x32,
            execute (ContractState) {
                const contractId = ContractState.B[1]
                ContractState.B = [0n, 0n, 0n, 0n]
                if (contractId === 0n) {
                    ContractState.B[0] = ContractState.creator
                    return
                }
                const targetContract = Contracts.find(Obj => Obj.contract === contractId)
                if (targetContract === undefined) {
                    return
                }
                ContractState.B[0] = targetContract.creator
            }
        },
        {
            funName: 'B_To_Assets_Of_Tx_In_A',
            opCode: 0x32,
            execute (ContractState) {
                const tx = Blockchain.transactions.find(TX => TX.recipient === ContractState.contract && TX.txid === ContractState.A[0])
                ContractState.B = [0n, 0n, 0n, 0n]
                if (tx === undefined) {
                    return
                }
                tx.tokens.forEach((tkn, idx) => {
                    if (idx < 4) {
                        ContractState.B[idx] = tkn.asset
                    }
                })
            }
        },
        {
            funName: 'send_All_to_Address_in_B',
            opCode: 0x32,
            execute (ContractState) {
                const account = Blockchain.getAccountFromId(ContractState.contract)
                const tx = ContractState.enqueuedTX.find(TX => TX.recipient === ContractState.B[0])
                if (tx !== undefined) {
                    tx.amount += account.balance
                    account.balance = 0n
                    return
                }
                ContractState.enqueuedTX.push({
                    recipient: ContractState.B[0],
                    amount: account.balance,
                    tokens: [],
                    messageArr: [0n, 0n, 0n, 0n]
                })
                account.balance = 0n
            }
        },
        {
            funName: 'send_Old_to_Address_in_B',
            opCode: 0x32,
            execute (ContractState) {
                const account = Blockchain.getAccountFromId(ContractState.contract)
                const tx = ContractState.enqueuedTX.find(TX => TX.recipient === ContractState.B[0])
                let sendBalance: bigint
                if (ContractState.previousBalance > account.balance) {
                    sendBalance = account.balance
                } else {
                    sendBalance = ContractState.previousBalance
                }
                account.balance -= sendBalance
                if (tx !== undefined) {
                    tx.amount += sendBalance
                    return
                }
                ContractState.enqueuedTX.push({
                    recipient: ContractState.B[0],
                    amount: sendBalance,
                    tokens: [],
                    messageArr: [0n, 0n, 0n, 0n]
                })
            }
        },
        {
            funName: 'send_A_to_Address_in_B',
            opCode: 0x32,
            execute (ContractState) {
                const tx = ContractState.enqueuedTX.find(TX => TX.recipient === ContractState.B[0])

                if (tx !== undefined) {
                    if (tx.messageArr.length === 31 * 4) {
                        tx.messageArr = []
                    }
                    tx.messageArr.push(ContractState.A[0], ContractState.A[1], ContractState.A[2], ContractState.A[3])
                    return
                }
                ContractState.enqueuedTX.push({
                    recipient: ContractState.B[0],
                    amount: 0n,
                    tokens: [],
                    messageArr: [ContractState.A[0], ContractState.A[1], ContractState.A[2], ContractState.A[3]]
                })
            }
        },
        {
            funName: 'Set_Map_Value_Keys_In_A',
            opCode: 0x32,
            execute (ContractState) {
                const found = ContractState.map.find(Obj => Obj.k1 === ContractState.A[0] && Obj.k2 === ContractState.A[1])
                if (found === undefined) {
                    ContractState.map.push({
                        k1: ContractState.A[0],
                        k2: ContractState.A[1],
                        value: ContractState.A[3]
                    })
                    return
                }
                found.value = ContractState.A[3]
            }
        },
        {
            funName: 'Mint_Asset',
            opCode: 0x32,
            execute (ContractState) {
                const quantity = ContractState.B[0]
                const asset = ContractState.B[1]
                if (ContractState.issuedAssets.find(val => val === asset) === undefined) {
                    return
                }
                const accountAsset = Blockchain.getAssetFromId(ContractState.contract, asset)
                accountAsset.quantity += quantity
            }
        },
        {
            funName: 'Distribute_To_Asset_Holders',
            opCode: 0x32,
            execute (ContractState) {
                const holdersAssetMinimum = ContractState.B[0]
                const holdersAsset = ContractState.B[1]
                let amountToDistribute = ContractState.A[0]
                const assetToDistribute = ContractState.A[2]
                let quantityToDistribute = ContractState.A[3]
                if (holdersAsset === 0n) {
                    return
                }
                const preliminaryHoldersCount = Blockchain.getAssetHoldersCount(holdersAsset, holdersAssetMinimum)
                if (preliminaryHoldersCount === 0n) {
                    return
                }
                if (assetToDistribute !== 0n) {
                    const accountAsset = Blockchain.getAssetFromId(ContractState.contract, assetToDistribute)
                    if (quantityToDistribute > accountAsset.quantity) {
                        quantityToDistribute = accountAsset.quantity
                    }
                    accountAsset.quantity -= quantityToDistribute
                }
                if (amountToDistribute > 0) {
                    const account = Blockchain.getAccountFromId(ContractState.contract)
                    if (amountToDistribute > account.balance) {
                        amountToDistribute = account.balance
                    }
                    account.balance -= amountToDistribute
                }
                if (quantityToDistribute === 0n && amountToDistribute === 0n) {
                    return
                }
                const holdersAndQuantity = Blockchain.getAllHolders(holdersAsset, holdersAssetMinimum)
                if (holdersAndQuantity.length === 0) {
                    // Cancel distribution akward situation in contract tring to distribute all its own asset
                    //  but it is the only holder.
                    const account = Blockchain.getAccountFromId(ContractState.contract)
                    account.balance += amountToDistribute
                    const accountAsset = Blockchain.getAssetFromId(ContractState.contract, assetToDistribute)
                    if (accountAsset) {
                        accountAsset.quantity += quantityToDistribute
                    }
                    return
                }
                holdersAndQuantity.sort((rowA, rowB) => {
                    return Number(rowA[1] - rowB[1])
                })
                const thisCirculatingSupply = holdersAndQuantity.reduce((prev, row) => {
                    return prev + row[1]
                }, 0n)
                let distributedAmount = 0n
                let distributedQuantity = 0n
                for (let i = 0; i < holdersAndQuantity.length; i++) {
                    const foundAccount = Blockchain.getAccountFromId(holdersAndQuantity[i][0])
                    if (assetToDistribute !== 0n) {
                        let quantityToHolder = (quantityToDistribute * holdersAndQuantity[i][1]) / thisCirculatingSupply
                        if (i === holdersAndQuantity.length - 1) {
                            // all remaining to last one, the higher share holder
                            quantityToHolder = quantityToDistribute - distributedQuantity
                        }
                        const foundDistAsset = foundAccount.tokens.find(tkn => tkn.asset === assetToDistribute)
                        if (foundDistAsset === undefined) {
                            foundAccount.tokens.push({ asset: assetToDistribute, quantity: quantityToHolder })
                        } else {
                            foundDistAsset.quantity += quantityToHolder
                        }
                        distributedQuantity += quantityToHolder
                    }
                    if (amountToDistribute !== 0n) {
                        let amountToHolder = (amountToDistribute * holdersAndQuantity[i][1]) / thisCirculatingSupply
                        if (i === holdersAndQuantity.length - 1) {
                            // all remaining to last one, the higher share holder
                            amountToHolder = amountToDistribute - distributedAmount
                        }
                        foundAccount.balance += amountToHolder
                        distributedAmount += amountToHolder
                    }
                }
                ContractState.enqueuedTX.push({
                    recipient: 0n,
                    amount: 0n,
                    tokens: [],
                    messageArr: [ // "Indirect balance/token distributed"
                        8386658473162862153n,
                        7305804385234280992n,
                        7214887984920753199n,
                        8391721685706109801n,
                        25701n
                    ]
                })
            }
        },
        {
            funName: 'Put_Last_Block_GSig_In_A',
            opCode: 0x32,
            execute (ContractState) {
                ContractState.A = [utils.getRandom64bit(),
                    utils.getRandom64bit(),
                    utils.getRandom64bit(),
                    utils.getRandom64bit()]
            }
        }
    ]

    static EXT_FUN_DAT: T_EXT_FUN_DAT[] = [
        {
            funName: 'set_A1',
            opCode: 0x33,
            execute (ContractState, value) {
                ContractState.A[0] = value
            }
        },
        {
            funName: 'set_A2',
            opCode: 0x33,
            execute (ContractState, value) {
                ContractState.A[1] = value
            }
        },
        {
            funName: 'set_A3',
            opCode: 0x33,
            execute (ContractState, value) {
                ContractState.A[2] = value
            }
        },
        {
            funName: 'set_A4',
            opCode: 0x33,
            execute (ContractState, value) {
                ContractState.A[3] = value
            }
        },
        {
            funName: 'set_B1',
            opCode: 0x33,
            execute (ContractState, value) {
                ContractState.B[0] = value
            }
        },
        {
            funName: 'set_B2',
            opCode: 0x33,
            execute (ContractState, value) {
                ContractState.B[1] = value
            }
        },
        {
            funName: 'set_B3',
            opCode: 0x33,
            execute (ContractState, value) {
                ContractState.B[2] = value
            }
        },
        {
            funName: 'set_B4',
            opCode: 0x33,
            execute (ContractState, value) {
                ContractState.B[3] = value
            }
        },
        {
            funName: 'A_to_Tx_after_Timestamp',
            opCode: 0x33,
            execute (ContractState, value) {
                const tx = Blockchain.getTxAfterTimestamp(value, ContractState.contract, ContractState.activationAmount)
                ContractState.A = [0n, 0n, 0n, 0n]
                if (tx !== undefined) {
                    tx.processed = true
                    ContractState.A[0] = tx.txid
                }
            }
        },
        {
            funName: 'send_to_Address_in_B',
            opCode: 0x33,
            execute (ContractState, value) {
                const recipient = ContractState.B[0]
                const asset = ContractState.B[1]
                let optionalSignaAmount = ContractState.B[2]
                if (optionalSignaAmount < 0n) {
                    optionalSignaAmount = 0n
                }
                if (value > Constants.maxPositive) {
                    return
                }
                const account = Blockchain.getAccountFromId(ContractState.contract)
                if (asset === 0n) {
                    if (value === 0n) {
                        return
                    }
                    if (value > account.balance) {
                        value = account.balance
                    }
                    account.balance -= value
                    const tx = ContractState.enqueuedTX.find(TX => TX.recipient === recipient && TX.tokens.length === 0)
                    if (tx !== undefined) {
                        tx.amount += value
                        return
                    }
                    ContractState.enqueuedTX.push({
                        recipient: recipient,
                        amount: value,
                        tokens: [],
                        messageArr: []
                    })
                    return
                }
                const accountAsset = Blockchain.getAssetFromId(ContractState.contract, asset)
                if (value > accountAsset.quantity) {
                    value = accountAsset.quantity
                }
                if (optionalSignaAmount > account.balance) {
                    optionalSignaAmount = account.balance
                }
                account.balance -= optionalSignaAmount
                accountAsset.quantity -= value
                const tx = ContractState.enqueuedTX.find(TX => TX.recipient === recipient && TX.tokens[0]?.asset === asset)
                if (tx) {
                    tx.tokens[0].quantity += value
                    tx.amount += optionalSignaAmount
                    return
                }
                const tkn = []
                if (value !== 0n) {
                    tkn.push({ asset, quantity: value })
                }
                ContractState.enqueuedTX.push({
                    recipient: recipient,
                    amount: optionalSignaAmount,
                    tokens: tkn,
                    messageArr: []
                })
            }
        }
    ]

    static EXT_FUN_DAT_2: T_EXT_FUN_DAT_2[] = [
        {
            funName: 'set_A1_A2',
            opCode: 0x34,
            execute (ContractState, value1, value2) {
                ContractState.A[0] = value1
                ContractState.A[1] = value2
            }
        },
        {
            funName: 'set_A3_A4',
            opCode: 0x34,
            execute (ContractState, value1, value2) {
                ContractState.A[2] = value1
                ContractState.A[3] = value2
            }
        },
        {
            funName: 'set_B1_B2',
            opCode: 0x34,
            execute (ContractState, value1, value2) {
                ContractState.B[0] = value1
                ContractState.B[1] = value2
            }
        },
        {
            funName: 'set_B3_B4',
            opCode: 0x34,
            execute (ContractState, value1, value2) {
                ContractState.B[2] = value1
                ContractState.B[3] = value2
            }
        }
    ]

    static EXT_FUN_RET: T_EXT_FUN_RET[] = [
        {
            funName: 'get_A1',
            opCode: 0x35,
            execute (ContractState) {
                return ContractState.A[0]
            }
        },
        {
            funName: 'get_A2',
            opCode: 0x35,
            execute (ContractState) {
                return ContractState.A[1]
            }
        },
        {
            funName: 'get_A3',
            opCode: 0x35,
            execute (ContractState) {
                return ContractState.A[2]
            }
        },
        {
            funName: 'get_A4',
            opCode: 0x35,
            execute (ContractState) {
                return ContractState.A[3]
            }
        },
        {
            funName: 'get_B1',
            opCode: 0x35,
            execute (ContractState) {
                return ContractState.B[0]
            }
        },
        {
            funName: 'get_B2',
            opCode: 0x35,
            execute (ContractState) {
                return ContractState.B[1]
            }
        },
        {
            funName: 'get_B3',
            opCode: 0x35,
            execute (ContractState) {
                return ContractState.B[2]
            }
        },
        {
            funName: 'get_B4',
            opCode: 0x35,
            execute (ContractState) {
                return ContractState.B[3]
            }
        },
        {
            funName: 'check_A_Is_Zero',
            opCode: 0x35,
            execute (ContractState) {
                if (ContractState.A.reduce((a, b) => a + b, 0n) === 0n) {
                    return 1n
                }
                return 0n
            }
        },
        {
            funName: 'check_B_Is_Zero',
            opCode: 0x35,
            execute (ContractState) {
                if (ContractState.B.reduce((a, b) => a + b, 0n) === 0n) {
                    return 1n
                }
                return 0n
            }
        },
        {
            funName: 'check_A_equals_B',
            opCode: 0x35,
            execute (ContractState) {
                if (ContractState.A[0] === ContractState.B[0] &&
                    ContractState.A[1] === ContractState.B[1] &&
                    ContractState.A[2] === ContractState.B[2] &&
                    ContractState.A[3] === ContractState.B[3]) {
                    return 1n
                }
                return 0n
            }
        },
        {
            funName: 'check_MD5_A_with_B',
            opCode: 0x35,
            execute (ContractState) {
                const MD5 = new HashLib('MD5')
                const md5hash = MD5.hash([ContractState.A[0], ContractState.A[1]])
                if (ContractState.B[0] === md5hash[0] && ContractState.B[1] === md5hash[1]) {
                    return 1n
                }
                return 0n
            }
        },
        {
            funName: 'check_HASH160_A_with_B',
            opCode: 0x35,
            execute (ContractState) {
                const RIPE = new HashLib('RIPEMD160')
                const RIPEhash = RIPE.hash([ContractState.A[0], ContractState.A[1], ContractState.A[2], ContractState.A[3]])
                if (ContractState.B[0] === RIPEhash[0] && ContractState.B[1] === RIPEhash[1] && (ContractState.B[2] & 0x00000000FFFFFFFFn) === RIPEhash[2]) {
                    return 1n
                }
                return 0n
            }
        },
        {
            funName: 'check_SHA256_A_with_B',
            opCode: 0x35,
            execute (ContractState) {
                const SHA256 = new HashLib('SHA256')
                const SHA256hash = SHA256.hash([ContractState.A[0], ContractState.A[1], ContractState.A[2], ContractState.A[3]])
                if (ContractState.B[0] === SHA256hash[0] &&
                    ContractState.B[1] === SHA256hash[1] &&
                    ContractState.B[2] === SHA256hash[2] &&
                    ContractState.B[3] === SHA256hash[3]) {
                    return 1n
                }
                return 0n
            }
        },
        {
            funName: 'Check_Sig_B_With_A',
            opCode: 0x35,
            execute (ContractState) {
                // TODO
                return 0n
            }
        },
        {
            funName: 'get_Block_Timestamp',
            opCode: 0x35,
            execute (ContractState) {
                return BigInt(Blockchain.currentBlock) << 32n
            }
        },
        {
            funName: 'get_Creation_Timestamp',
            opCode: 0x35,
            execute (ContractState) {
                return BigInt(ContractState.creationBlock) << 32n
            }
        },
        {
            funName: 'get_Last_Block_Timestamp',
            opCode: 0x35,
            execute (ContractState) {
                return BigInt(Blockchain.currentBlock - 1) << 32n
            }
        },
        {
            funName: 'get_Type_for_Tx_in_A',
            opCode: 0x35,
            execute (ContractState) {
                const tx = Blockchain.getTxFrom(ContractState.A[0])
                if (tx === undefined || tx.recipient !== ContractState.contract) {
                    return Constants.minus1
                }
                return BigInt(tx.type)
            }
        },
        {
            funName: 'get_Amount_for_Tx_in_A',
            opCode: 0x35,
            execute (ContractState) {
                const tx = Blockchain.getTxFrom(ContractState.A[0])
                if (tx === undefined || tx.recipient !== ContractState.contract) {
                    return Constants.minus1
                }
                const asset = ContractState.A[1]
                if (asset === 0n) {
                    return tx.amount - ContractState.activationAmount
                }
                const foundAsset = tx.tokens.find(tkn => tkn.asset === asset)
                return foundAsset?.quantity ?? 0n
            }
        },
        {
            funName: 'get_Timestamp_for_Tx_in_A',
            opCode: 0x35,
            execute (ContractState) {
                const tx = Blockchain.getTxFrom(ContractState.A[0])
                if (tx === undefined || tx.recipient !== ContractState.contract) {
                    return Constants.minus1
                }
                return tx.timestamp
            }
        },
        {
            funName: 'get_Ticket_Id_for_Tx_in_A',
            opCode: 0x35,
            execute (ContractState) {
                const tx = Blockchain.getTxFrom(ContractState.A[0])
                if (tx === undefined || tx.recipient !== ContractState.contract) {
                    return Constants.minus1
                }
                if (tx.blockheight + Constants.getRandomSleepBlocks > Blockchain.currentBlock) {
                    ContractState.frozen = false
                    ContractState.running = false
                    ContractState.stopped = true
                    ContractState.finished = false
                    ContractState.previousBalance = Blockchain.getBalanceFrom(ContractState.contract)
                    ContractState.sleepUntilBlock = tx.blockheight + Constants.getRandomSleepBlocks
                    return 0n
                }
                return utils.getRandom64bit()
            }
        },
        {
            funName: 'get_Current_Balance',
            opCode: 0x35,
            execute (ContractState) {
                const asset = ContractState.B[1]
                if (asset === 0n) {
                    return Blockchain.getBalanceFrom(ContractState.contract)
                }
                return Blockchain.getTokenQuantityFrom(ContractState.contract, asset)
            }
        },
        {
            funName: 'get_Previous_Balance',
            opCode: 0x35,
            execute (ContractState) {
                return ContractState.previousBalance
            }
        },
        {
            funName: 'Get_Code_Hash_Id',
            opCode: 0x35,
            execute (ContractState) {
                const atId = ContractState.B[1]
                if (atId === 0n || atId === ContractState.contract) {
                    return ContractState.codeHashId
                }
                const foundContract = Contracts.find(Obj => Obj.contract === atId)
                if (foundContract === undefined) {
                    return 0n
                }
                return foundContract.codeHashId
            }
        },
        {
            funName: 'Get_Map_Value_Keys_In_A',
            opCode: 0x35,
            execute (ContractState) {
                let targetMap = ContractState.map
                const targetId = ContractState.A[2]
                if (targetId !== 0n && targetId !== ContractState.contract) {
                    const contractMap = Blockchain.getMapFromId(targetId)
                    if (contractMap === undefined) {
                        return 0n
                    }
                    targetMap = contractMap.map
                }
                const found = targetMap.find(Obj => Obj.k1 === ContractState.A[0] && Obj.k2 === ContractState.A[1])
                if (found === undefined) {
                    return 0n
                }
                return found.value
            }
        },
        {
            funName: 'Issue_Asset',
            opCode: 0x35,
            execute (ContractState) {
                let tokenID = Constants.nextTokenID
                if (tokenID === 0n) {
                    tokenID = Constants.tokenID
                    Constants.nextTokenID = Constants.tokenID
                }
                ContractState.issuedAssets.push(tokenID)
                ContractState.enqueuedTX.push({
                    recipient: 0n,
                    amount: 0n,
                    tokens: [{ asset: tokenID, quantity: 0n }],
                    messageArr: [ContractState.A[0], ContractState.A[1], 0n, 0n]
                })
                // Incremented next mint asset id
                Constants.nextTokenID++
                return tokenID
            }
        },
        {
            funName: 'Get_Asset_Holders_Count',
            opCode: 0x35,
            execute (ContractState) {
                const mininum = ContractState.B[0]
                const asset = ContractState.B[1]
                return Blockchain.getAssetHoldersCount(asset, mininum)
            }
        },
        {
            funName: 'Get_Activation_Fee',
            opCode: 0x35,
            execute (ContractState) {
                const atId = ContractState.B[1]
                if (atId === 0n || atId === ContractState.contract) {
                    return ContractState.activationAmount
                }
                const foundContract = Contracts.find(Obj => Obj.contract === atId)
                if (foundContract === undefined) {
                    return 0n
                }
                return foundContract.activationAmount
            }
        },
        {
            funName: 'Get_Asset_Circulating',
            opCode: 0x35,
            execute (ContractState) {
                const asset = ContractState.B[1]
                if (asset === 0n) {
                    return 0n
                }
                return Blockchain.getAssetCirculating(asset)
            }
        }
    ]

    static EXT_FUN_RET_DAT_2: T_EXT_FUN_RET_DAT_2[] = [
        {
            funName: 'add_Minutes_to_Timestamp',
            opCode: 0x37,
            execute (ContractState, timestamp, minutes) {
                return ((minutes / 4n) << 32n) + timestamp
            }
        }
    ]
}
