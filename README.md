# SC-Simulator
Smart contracts simulator and debugger for Signum

## Usage
[Run it](https://deleterium.github.io/SC-Simulator/try.html) on gitpages. Load example to try it with a simple contract. Transactions are JSON text to be parsed every time a block is forged and an example is provided on first load. You can prepare all transactions or can edit many times the same to get desired result. Remember to match tx.blockheight to Blockchain.currentBlock plus one. Note shortcuts for buttons via accesskeys. For big programs it is possible to detach all fieldsets to have a different view, more static.
### Breakpoints
Contract execution will halt on breakpoints. Toggle manually using the button and enter the line to stop. It is possible to click a line to toggle breakpoint state.
### Memory inspector
You can check current memory values on table or pointing mouse over a variable name on code. Special attention to current contract states (stopped, frozen, finished, running or dead). Its is possible to check values for 256-bit pseudo-register A and B as its four longs parts A1..A4 and B1..B4. Lastly is presented other values for contract state, maybe it worth to check code/user stack.
### Forging
All contracts will be executed in order to forge a new block. Breakpoints are disregarded during this process.
### Multi contracts
It is possible to deploy many contracts. At any time, you can change and inspect other contract, just inform contract slot you want to check. Contracts id's will be incremented if there is other deployed with same id.
### Preprocessor directives
When dealing with many contracts, some options can be handyfull and will override default constants when deploying a contract. Using these directives it is possible to set different values for contracts deployed on same run:
* `^program activationAmount VALUE`
* `^program creator VALUE`
* `^program contract VALUE`
* `^program DataPages VALUE`
* `^program UserStackPages VALUE`
* `^program CodeStackPages VALUE`

## Limitations
* Pointer operations can lead to *false dead state* in simulator. Please declare all variables if using these instructions.
* No check on balance. Balance can go negative for regular accounts, but not for Smart Contract.
* Messages sent by contract only appears in blockchain when forging next block. This is to simulate actual signum, where only one tx is sent for each account during one block execution.

## Configuration
To set new defaults values you will need to run the project locally:
* Clone repository
* Change values on javascript files and run `npm run start`
* Or change values on typescript files and run `npm run dev`

File out/index.js or src/index.ts can be edited to change Constants:
* stepfee: Value discounted from contract everytime an instruction is executed. Set to zero if to avoid contract to be frozen due to "out-of-gas"
* activationAmount: Default contract activation amount.
* deploy_add_balance: Added balance to contract when deploying it. Actualy is zero, but it is annoying sending a message only to first run.
* contractDPages: Number of data pages of deployed contract
* contractUSPages: Number of user stack pages of deployed contract
* contractCSPages: Number of code stack pages of deployed contract
* creatorID: Account ID of creator
* contractID: Account ID of contract
* getRandomSleepBlocks: Sleep blocks during API to get random ticket. Main net: 15 blocks, testnet 2 blocks.

## How to run from bytecode?
SC Simulator is an assembly interpreter. It is not possible to run directly the bytecode. Use a decompiler (like  [Signum D`Or](https://github.com/deleterium/Signum-D-Or) to generate an assembly output.
