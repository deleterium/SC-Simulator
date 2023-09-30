# SC-Simulator
Smart contracts simulator and debugger for Signum

## Usage
[Run it](https://deleterium.info/sc-simulator) on my personal page. Optionally clone the repository, and run the application with `npm ci`, then `npm run build` and then `npm run start`. Load example to try it with a simple contract.
For big programs it is possible to detach all fieldsets to have a different view, more static. 

### Transactions
Transactions are JSON text to be parsed every time a block is forged and an example is provided on first load. You can prepare all transactions or can edit many times the same to get desired result. Remember to match tx.blockheight to Blockchain.currentBlock plus one. Note shortcuts for buttons via accesskeys. Use the following attributes:
* "sender": long representation for a user id. Examples "12345988376423098", "0xAABBDD". Values will be parsed as big integer, but can be written as string, bigint (exame 15n) or number (without quotes, but not recomended).
* "recipient": long representation for a user id. Same rules as "sender".
* "amount": long representation for a NQT amount. Underscore will be disregarded but help with zeroes counting. Can be number, string or bigint. Examples: "100_0000_0000n", 213, "840000"
* "blockheight": number of block. Used as number. Use only integers. Can be specified as string also.
* "txid": specify a transaction id for a given transaction. It is optional and, if not present, a random id will be generated.
* "messageText": a string to be sent to the contract. Similar to send a message and set "MessageIsText" to true.
* "messageHex": a hexadecimal string to be sent to the contract. Similar to send a message and set "MessageIsText" to false.
* "tokens": an array of asset objects. Signum blockchain support at most 4 assets in one transaction. One asset is defined by:
  * "asset": long representation for an asset id. Same rules as "sender".
  * "quantity": long representation for an asset quantity in QNT. Same rules as "amount".

### Breakpoints
Contract execution will halt on breakpoints. Toggle manually using the button and enter the line to stop. It is possible to click a line to toggle breakpoint state.

### Memory inspector
You can check current memory values on table (C or Assembly) or pointing mouse over a variable name on code (just in Assembly). Special attention to current contract states (stopped, frozen, finished, running or dead). Its is possible to check values for 256-bit pseudo-register A and B as its four longs parts A1..A4 and B1..B4. Lastly is presented other values for contract state, maybe it worth to check code/user stack.

### Forging
All contracts will be executed in order to forge a new block. Breakpoints are disregarded during this process.

### Multi contracts
It is possible to deploy many contracts. At any time, you can change and inspect other contract, just inform contract slot you want to check. Contracts id's will be incremented if there is other deployed with same id.

### Preprocessor directives
When dealing with many contracts, some options can be handy and will override default constants when deploying a contract. Using these directives it is possible to set different values for contracts deployed on same run:
* SmartC
  * `#program activationAmount VALUE`
  * `#program creator VALUE`
  * `#program contract VALUE`
  * `#program userStackPages VALUE`
  * `#program codeStackPages VALUE`
  * `#program codeHashId VALUE`
* Assembly
  * `^program activationAmount VALUE`
  * `^program creator VALUE`
  * `^program contract VALUE`
  * `^program DataPages VALUE`
  * `^program UserStackPages VALUE`
  * `^program CodeStackPages VALUE`
  * `^program codeHashId VALUE`

## Limitations
* Pointer operations can lead to *false dead state* in simulator (only if deploying assembly contracts). Please declare all variables if using these instructions.
* No checks for accounts balance. Balance can go negative for regular accounts, but not for Smart Contract.
* Messages sent by contract only appears in blockchain when forging next block. This is to simulate actual signum, where only one tx is sent for each account during one block execution. During debug it is possible to check tem as 'enqueuedTX' property in 'Contract State'
* Only smart contracts from version 3 are supported, according to Signum Rainbow HF (active since 25/jun/2022). If you want to debug one from version 2, please download and install SC-Simulator version [1.0](https://github.com/deleterium/SC-Simulator/releases/tag/v1.0).
* The API *Check_Sig_B_With_A* is not implemented and will always return zero/false.
* The balance burned can be slightly different in signum-node. This is because some jumps destinations are too far away and then a second instruction must be used. This process happens during compilation this program is an interpreter. 

## Configuration
To set new defaults values you will need to run the project locally:
* Clone repository
* Change values on javascript files and run `npm run start`
* Or change values on typescript files and run `npm run dev`

File out/index.js or src/index.ts can be edited to change Constants:
* stepfee: Value discounted from contract everytime an instruction is executed. Set to zero if to avoid contract to be frozen due to "out-of-gas"
* activationAmount: Default contract activation amount.
* deploy_add_balance: Added balance to contract when deploying it. Currently is zero, so you must send a transaction to active the contract.
* contractDPages: Number of data pages of deployed contract
* contractUSPages: Number of user stack pages of deployed contract
* contractCSPages: Number of code stack pages of deployed contract
* creatorID: Account ID of creator
* contractID: Account ID of contract
* getRandomSleepBlocks: Sleep blocks during API to get random ticket. Main net: 15 blocks, testnet 2 blocks.

## How to run from bytecode?
SC Simulator is an assembly interpreter. It is not possible to run directly the bytecode. Use a decompiler (like  [Signum D`Or](https://github.com/deleterium/Signum-D-Or) to generate an assembly output.


# Usage on Automated Testing (experimental)

It is possible to use the Simulator for Automated Testing. The Simulator can run on NodeJS environments and being tested with common testrunner like Jest, Vitest, etc
This way one can write complete test suites and run them quickly on the command line and/or IDEs like VSCode, Webstorm etc. - This TDD (Test Drive Development) speeds up 
development significantly and also increases the security/safety of contracts, as automated Test Suites tends to increase the coverage of complex scenarios. 

> There'll be a template project to use for instant Testbed set up. Stay tuned!
