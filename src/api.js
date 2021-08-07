'use strict'

// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License

const API_microcode = [
    { name: "get_A1", op_code: 0x35,
        execute: function () {
            return MachineState.A[0]
        }
    },
    { name: "get_A2", op_code: 0x35,
        execute: function () {
            return MachineState.A[1]
        }
    },
    { name: "get_A3", op_code: 0x35,
        execute: function () {
            return MachineState.A[2]
        }
    },
    { name: "get_A4", op_code: 0x35,
        execute: function () {
            return MachineState.A[3]
        }
    },
    { name: "get_B1", op_code: 0x35,
        execute: function () {
            return MachineState.B[0]
        }
    },
    { name: "get_B2", op_code: 0x35,
        execute: function () {
            return MachineState.B[1]
        }
    },
    { name: "get_B3", op_code: 0x35,
        execute: function () {
            return MachineState.B[2]
        }
    },
    { name: "get_B4", op_code: 0x35,
        execute: function () {
            return MachineState.B[3]
        }
    },
    { name: "set_A1", op_code: 0x33,
        execute: function (value) {
            MachineState.A[0] = value
        }
    },
    { name: "set_A2", op_code: 0x33,
        execute: function (value) {
            MachineState.A[1] = value
        }
    },
    { name: "set_A3", op_code: 0x33,
        execute: function (value) {
            MachineState.A[2] = value
        }
    },
    { name: "set_A4", op_code: 0x33,
        execute: function (value) {
            MachineState.A[3] = value
        }
    },
    { name: "set_A1_A2", op_code: 0x34,
        execute: function (value1, value2) {
            MachineState.A[0] = value1
            MachineState.A[1] = value2
        }
    },
    { name: "set_A3_A4", op_code: 0x34,
        execute: function (value1, value2) {
            MachineState.A[2] = value1
            MachineState.A[3] = value2
        }
    },
    { name: "set_B1", op_code: 0x33,
        execute: function (value) {
            MachineState.B[0] = value
        }
    },
    { name: "set_B2", op_code: 0x33,
        execute: function (value) {
            MachineState.B[1] = value
        }
    },
    { name: "set_B3", op_code: 0x33,
        execute: function (value) {
            MachineState.B[2] = value
        }
    },
    { name: "set_B4", op_code: 0x33,
        execute: function (value) {
            MachineState.B[3] = value
        }
    },
    { name: "set_B1_B2", op_code: 0x34,
        execute: function (value1, value2) {
            MachineState.B[0] = value1
            MachineState.B[1] = value2
        }
    },
    { name: "set_B3_B4", op_code: 0x34,
        execute: function (value1, value2) {
            MachineState.B[2] = value1
            MachineState.B[3] = value2
        }
    },
    { name: "clear_A", op_code: 0x32,
        execute: function () {
            MachineState.A = [ 0n, 0n, 0n, 0n ]
        }
    },
    { name: "clear_B", op_code: 0x32,
        execute: function () {
            MachineState.B = [ 0n, 0n, 0n, 0n ]
        }
    },
    { name: "clear_A_B", op_code: 0x32,
        execute: function () {
            MachineState.A = [ 0n, 0n, 0n, 0n ]
            MachineState.B = [ 0n, 0n, 0n, 0n ]
        }
    },
    { name: "copy_A_From_B", op_code: 0x32,
        execute: function () {
            MachineState.A = [  MachineState.B[0],
                                MachineState.B[1],
                                MachineState.B[2],
                                MachineState.B[3] ]
        }
    },
    { name: "copy_B_From_A", op_code: 0x32,
        execute: function () {
            MachineState.B = [  MachineState.A[0],
                                MachineState.A[1],
                                MachineState.A[2],
                                MachineState.A[3] ]
        }
    },
    { name: "check_A_Is_Zero", op_code: 0x35,
        execute: function () {
            //wrong boolean logic, but consistent to signum. Avoid using this function...
            if ( MachineState.A.reduce((a, b) => a + b, 0n) == 0 )
                return 0n
            return 1n
        }
    },
    { name: "check_B_Is_Zero", op_code: 0x35,
        execute: function () {
            //wrong boolean logic, but consistent to signum. Avoid using this function...
            if ( MachineState.B.reduce((a, b) => a + b, 0n) == 0 )
                return 0n
            return 1n
        }
    },
    { name: "check_A_equals_B", op_code: 0x35,
        execute: function () {
            if (   MachineState.A[0] == MachineState.B[0]
                && MachineState.A[1] == MachineState.B[1]
                && MachineState.A[2] == MachineState.B[2]
                && MachineState.A[3] == MachineState.B[3] )
                return 1n
            return 0n
        }
    },
    { name: "swap_A_and_B", op_code: 0x32,
        execute: function () {
            let temp = [  MachineState.B[0],
                MachineState.B[1],
                MachineState.B[2],
                MachineState.B[3] ]
            MachineState.B = [  MachineState.A[0],
                MachineState.A[1],
                MachineState.A[2],
                MachineState.A[3] ]
            MachineState.A = [ temp[0],
                temp[1],
                temp[2],
                temp[3] ]
        }
    },
    { name: "OR_A_with_B", op_code: 0x32,
        execute: function () {
            MachineState.A[0] |= MachineState.B[0]
            MachineState.A[1] |= MachineState.B[1]
            MachineState.A[2] |= MachineState.B[2]
            MachineState.A[3] |= MachineState.B[3]
        }
    },
    { name: "OR_B_with_A", op_code: 0x32,
        execute: function () {
            MachineState.B[0] |= MachineState.A[0]
            MachineState.B[1] |= MachineState.A[1]
            MachineState.B[2] |= MachineState.A[2]
            MachineState.B[3] |= MachineState.A[3]
        }
    },
    { name: "AND_A_with_B", op_code: 0x32,
        execute: function () {
            MachineState.A[0] &= MachineState.B[0]
            MachineState.A[1] &= MachineState.B[1]
            MachineState.A[2] &= MachineState.B[2]
            MachineState.A[3] &= MachineState.B[3]
        }
    },
    { name: "AND_B_with_A", op_code: 0x32,
        execute: function () {
            MachineState.B[0] &= MachineState.A[0]
            MachineState.B[1] &= MachineState.A[1]
            MachineState.B[2] &= MachineState.A[2]
            MachineState.B[3] &= MachineState.A[3]
        }
    },
    { name: "XOR_A_with_B", op_code: 0x32,
        execute: function () {
            MachineState.A[0] ^= MachineState.B[0]
            MachineState.A[1] ^= MachineState.B[1]
            MachineState.A[2] ^= MachineState.B[2]
            MachineState.A[3] ^= MachineState.B[3]
        }
    },
    { name: "XOR_B_with_A", op_code: 0x32,
        execute: function () {
            MachineState.B[0] ^= MachineState.A[0]
            MachineState.B[1] ^= MachineState.A[1]
            MachineState.B[2] ^= MachineState.A[2]
            MachineState.B[3] ^= MachineState.A[3]
        }
    },
    { name: "add_A_to_B", op_code: 0x32,
        execute: function () {
            let a = utils.messagearray2superregister(MachineState.A)
            let b = utils.messagearray2superregister(MachineState.B)
            MachineState.B=utils.superregister2messagearray(a + b)
        }
    },
    { name: "add_B_to_A", op_code: 0x32,
        execute: function () {
            let a = utils.messagearray2superregister(MachineState.A)
            let b = utils.messagearray2superregister(MachineState.B)
            MachineState.A=utils.superregister2messagearray(a + b)
        }
    },
    { name: "sub_A_from_B", op_code: 0x32,
        execute: function () {
            let a = utils.messagearray2superregister(MachineState.A)
            let b = utils.messagearray2superregister(MachineState.B)
            MachineState.B=utils.superregister2messagearray(b - a)
        }
    },
    { name: "sub_B_from_A", op_code: 0x32,
        execute: function () {
            let a = utils.messagearray2superregister(MachineState.A)
            let b = utils.messagearray2superregister(MachineState.B)
            MachineState.A=utils.superregister2messagearray(a - b)
        }
    },
    { name: "mul_A_by_B", op_code: 0x32,
        execute: function () {
            let a = utils.messagearray2superregister(MachineState.A)
            let b = utils.messagearray2superregister(MachineState.B)
            MachineState.B=utils.superregister2messagearray(a * b)
        }
    },
    { name: "mul_B_by_A", op_code: 0x32,
        execute: function () {
            let a = utils.messagearray2superregister(MachineState.A)
            let b = utils.messagearray2superregister(MachineState.B)
            MachineState.A=utils.superregister2messagearray(a * b)
        }
    },
    { name: "div_A_by_B", op_code: 0x32,
        execute: function () {
            let a = utils.messagearray2superregister(MachineState.A)
            let b = utils.messagearray2superregister(MachineState.B)
            if (b == 0)
                return
            MachineState.B=utils.superregister2messagearray(a / b)
        }
    },
    { name: "div_B_by_A", op_code: 0x32,
        execute: function () {
            let a = utils.messagearray2superregister(MachineState.A)
            let b = utils.messagearray2superregister(MachineState.B)
            if (a == 0)
                return
            MachineState.A=utils.superregister2messagearray(b / a)
        }
    },
    { name: "MD5_A_to_B", op_code: 0x32,
        execute: function () {
            let MD5 = new HashLib("MD5")
            let md5hash = MD5.hash( [ MachineState.A[0], MachineState.A[1] ] )
            MachineState.B[0]=md5hash[0]
            MachineState.B[1]=md5hash[1]
        }
    },
    { name: "check_MD5_A_with_B", op_code: 0x35,
        execute: function () {
            let MD5 = new HashLib("MD5")
            let md5hash = MD5.hash( [ MachineState.A[0], MachineState.A[1] ] )
            if (MachineState.B[0]==md5hash[0] && MachineState.B[1]==md5hash[1])
                return 1n
            return 0n
        }
    },
    { name: "HASH160_A_to_B", op_code: 0x32,
        execute: function () {
            let RIPE = new HashLib("RIPEMD160")
            let RIPEhash = RIPE.hash( [ MachineState.A[0], MachineState.A[1], MachineState.A[2], MachineState.A[3] ] )
            MachineState.B[0]=RIPEhash[0]
            MachineState.B[1]=RIPEhash[1]
            MachineState.B[2]=RIPEhash[2]
        }
    },
    { name: "check_HASH160_A_with_B", op_code: 0x35,
        execute: function () {
            let RIPE = new HashLib("RIPEMD160")
            let RIPEhash = RIPE.hash( [ MachineState.A[0], MachineState.A[1], MachineState.A[3], MachineState.A[4] ] )
            if (MachineState.B[0]==RIPEhash[0] && MachineState.B[1]==RIPEhash[1] && (MachineState.B[2] & 0x00000000FFFFFFFFn) == RIPEhash[2])
                return 1n
            return 0n
        }
    },
    { name: "SHA256_A_to_B", op_code: 0x32,
        execute: function () {
            let SHA256 = new HashLib("SHA256")
            let SHA256hash = SHA256.hash( [ MachineState.A[0], MachineState.A[1], MachineState.A[2], MachineState.A[3] ] )
            MachineState.B[0]=SHA256hash[0]
            MachineState.B[1]=SHA256hash[1]
            MachineState.B[2]=SHA256hash[2]
            MachineState.B[3]=SHA256hash[3]
        }
    },
    { name: "check_SHA256_A_with_B", op_code: 0x35,
        execute: function () {
            let SHA256 = new HashLib("SHA256")
            let SHA256hash = SHA256.hash( [ MachineState.A[0], MachineState.A[1], MachineState.A[2], MachineState.A[3] ] )
            if ( MachineState.B[0]==SHA256hash[0] &&
                 MachineState.B[1]==SHA256hash[1] &&
                 MachineState.B[2]==SHA256hash[2] &&
                 MachineState.B[3]==SHA256hash[3] )
            {
                return 1n
            }
            return 0n
        }
    },
    { name: "get_Block_Timestamp", op_code: 0x35,
        execute: function () {
            return BigInt(BlockchainState.currentBlock) << 32n
        }
    },
    { name: "get_Creation_Timestamp", op_code: 0x35,
        execute: function () {
            return 1n << 32n
        }
    },
    { name: "get_Last_Block_Timestamp", op_code: 0x35,
        execute: function () {
            return BigInt(BlockchainState.currentBlock - 1) << 32n
        }
    },
    { name: "put_Last_Block_Hash_In_A", op_code: 0x32,
        execute: function () {
            MachineState.A = [  utils.getRandom64bit(),
                                utils.getRandom64bit(),
                                utils.getRandom64bit(),
                                utils.getRandom64bit() ]
        }
    },
    { name: "A_to_Tx_after_Timestamp", op_code: 0x33,
        execute: function (value) {
            let tx = BlockchainState.transactions.find(TX => TX.recipient == MachineState.contract
                && TX.timestamp > value && TX.amount >= MachineState.activationAmount
                && TX.blockheight < BlockchainState.currentBlock)
            MachineState.A = [ 0n, 0n, 0n, 0n ]
            if (tx !== undefined) {
                tx.processed=true
                MachineState.A[0]=tx.txid
            }
        }
    },
    { name: "get_Type_for_Tx_in_A", op_code: 0x35,
        execute: function () {
            let tx = BlockchainState.transactions.find(TX => TX.recipient == MachineState.contract && TX.txid == MachineState.A[0])
            if (tx === undefined) {
                return utils.minus1
            }
            if (tx.messageArr.reduce((a, b) => a + b, 0n) == 0) {
                return 0n
            }
            return 1n
        }
    },
    { name: "get_Amount_for_Tx_in_A", op_code: 0x35,
        execute: function () {
            let tx = BlockchainState.transactions.find(TX => TX.recipient == MachineState.contract && TX.txid == MachineState.A[0])
            if (tx === undefined) {
                return utils.minus1
            }
            return tx.amount - MachineState.activationAmount
        }
    },
    { name: "get_Timestamp_for_Tx_in_A", op_code: 0x35,
        execute: function () {
            let tx = BlockchainState.transactions.find(TX => TX.recipient == MachineState.contract && TX.txid == MachineState.A[0])
            if (tx === undefined) {
                return utils.minus1
            }
            return tx.timestamp
        }
    },
    { name: "get_Ticket_Id_for_Tx_in_A", op_code: 0x35,
        execute: function () {
            let tx = BlockchainState.transactions.find(TX => TX.recipient == MachineState.contract && TX.txid == MachineState.A[0])
            if (tx === undefined) {
                return utils.minus1
            }
            if (tx.blockheight + Constants.getRandomSleepBlocks > BlockchainState.currentBlock ) {
                MachineState.frozen=false
                MachineState.running=false
                MachineState.stopped=true
                MachineState.finished=false
                MachineState.previousBalance = BlockchainState.accounts.find(acc => acc.id == MachineState.contract).balance
                MachineState.sleepUntilBlock= tx.blockheight + Constants.getRandomSleepBlocks
                return 0n
            }
            return utils.getRandom64bit()
        }
    },
    { name: "message_from_Tx_in_A_to_B", op_code: 0x32,
        execute: function () {
            let tx = BlockchainState.transactions.find(TX => TX.recipient == MachineState.contract && TX.txid == MachineState.A[0])
            if (tx === undefined) {
                MachineState.B = [ 0n, 0n, 0n, 0n ]
                return
            }
            MachineState.B = [ tx.messageArr[0], tx.messageArr[1], tx.messageArr[2], tx.messageArr[3] ]
        }
    },
    { name: "B_to_Address_of_Tx_in_A", op_code: 0x32,
        execute: function () {
            let tx = BlockchainState.transactions.find(TX => TX.recipient == MachineState.contract && TX.txid == MachineState.A[0])
            MachineState.B = [ 0n, 0n, 0n, 0n ]
            if (tx === undefined) {
                return
            }
            MachineState.B[0] = tx.sender
        }
    },
    { name: "B_to_Address_of_Creator", op_code: 0x32,
        execute: function () {
            MachineState.B = [ MachineState.creator, 0n, 0n, 0n ]
        }
    },
    { name: "get_Current_Balance", op_code: 0x35,
        execute: function () {
            let account = BlockchainState.accounts.find(acc => acc.id == MachineState.contract)
            return account.balance
        }
    },
    { name: "get_Previous_Balance", op_code: 0x35,
        execute: function () {
            return MachineState.previousBalance
        }
    },
    { name: "send_to_Address_in_B", op_code: 0x33,
        execute: function (value) {
            let account = BlockchainState.accounts.find(acc => acc.id == MachineState.contract)
            let tx = ContractController.enqueuedTX.find( TX => TX.recipient == MachineState.B[0] )
            if (value > account.balance) {
                value = account.balance
            }
            account.balance-= value
            if (tx !== undefined) {
                tx.amount+=value
                return
            }
            ContractController.enqueuedTX.push({
                recipient: MachineState.B[0],
                amount: value,
                messageArr: [ 0n, 0n, 0n, 0n ]
            })
        }
    },
    { name: "send_All_to_Address_in_B", op_code: 0x32,
        execute: function () {
            let account = BlockchainState.accounts.find(acc => acc.id == MachineState.contract)
            let tx = ContractController.enqueuedTX.find( TX => TX.recipient == MachineState.B[0] )
            if (tx !== undefined) {
                tx.amount += account.balance
                account.balance = 0
                return
            }
            ContractController.enqueuedTX.push({
                recipient: MachineState.B[0],
                amount: account.balance,
                messageArr: [ 0n, 0n, 0n, 0n ]
            })
            account.balance = 0
        }
    },
    { name: "send_Old_to_Address_in_B", op_code: 0x32,
        execute: function () {
            let account = BlockchainState.accounts.find(acc => acc.id == MachineState.contract)
            let tx = ContractController.enqueuedTX.find( TX => TX.recipient == MachineState.B[0] )
            let sendBalance
            if (MachineState.previousBalance > account.balance) {
                sendBalance = account.balance
            } else {
                sendBalance = MachineState.previousBalance
            }
            account.balance -= sendBalance
            if (tx !== undefined) {
                tx.amount += sendBalance
                return
            }
            ContractController.enqueuedTX.push({
                recipient: MachineState.B[0],
                amount: sendBalance,
                messageArr: [ 0n, 0n, 0n, 0n ]
            })
        }
    },
    { name: "send_A_to_Address_in_B", op_code: 0x32,
        execute: function () {
            //let account = BlockchainState.accounts.find(acc => acc.id == MachineState.contract)
            let tx = ContractController.enqueuedTX.find( TX => TX.recipient == MachineState.B[0] )

            if (tx !== undefined) {
                tx.messageArr = [ MachineState.A[0], MachineState.A[1], MachineState.A[2], MachineState.A[3] ]
                return
            }
            ContractController.enqueuedTX.push({
                recipient: MachineState.B[0],
                amount: 0n,
                messageArr: [ MachineState.A[0], MachineState.A[1], MachineState.A[2], MachineState.A[3] ]
            })
        }
    },
    { name: "add_Minutes_to_Timestamp", op_code: 0x37,
        execute: function (timestamp, minutes) {
            return ((minutes/4n) << 32n) + timestamp
        }
    },
]
