import { Contracts, Blockchain, Constants } from './index.js';
import { CONTRACT } from './contract.js';
export class SIMULATOR {
    constructor() {
        this.breakpoints = [];
        this.lastUpdateMemory = [];
        this.UpcomingTransactions = [];
        this.lastA = [0n, 0n, 0n, 0n];
        this.lastB = [0n, 0n, 0n, 0n];
    }
    /**
     * Verifies and parse upcoming transactions
     *
     * @param JSONobj string containing JSON object with transactions to be
     * processed
     *
     * @return string indicating error. Empty string on success
     */
    parseUpcomingTransactions(JSONobj) {
        try {
            this.UpcomingTransactions = JSON.parse(JSONobj, (key, value) => {
                if (typeof value === 'string') {
                    if (/^[\d_]+n$/.test(value)) {
                        return BigInt(value.substr(0, value.length - 1).replace(/_/g, ''));
                    }
                    if (/^0[xX][\da-fA-F_]+n$/.test(value)) {
                        return BigInt(value.substr(0, value.length - 1).replace(/_/g, ''));
                    }
                    if (key === 'blockheight') {
                        return Number(value);
                    }
                    if (key === 'sender' || key === 'recipient' || key === 'amount') {
                        return BigInt(value.replace(/_/g, ''));
                    }
                }
                return value;
            });
        }
        catch (error) {
            return "Could not parse transactions JSON text. Atention on ','!!! " + error;
        }
        return '';
    }
    /**
     * Handle process of forging one block
     *
     * @param nextTXs string containing JSON object with transactions to be
     * processed
     *
     * @return string indicating status or error.
     */
    forgeBlock(nextTXs) {
        let rcString = '';
        rcString = this.parseUpcomingTransactions(nextTXs);
        if (rcString !== '') {
            // Avoid any execution if object is malformed
            return rcString;
        }
        // Runs all contracts for current blockheight
        Contracts.forEach(curContract => {
            curContract.run();
            curContract.dispatchEnqueuedTX();
        });
        // Includes user transactions in blockchain. So they were not processed by contracts
        //  at this height.
        Blockchain.addTransactions(this.UpcomingTransactions);
        // This actually increases blockheigth count.
        Blockchain.forgeBlock();
        // Checks and activates contracts at this blockheight
        Contracts.forEach(curContract => {
            curContract.forgeBlock();
        });
        return 'Block #' + Blockchain.currentBlock + ' forged!';
    }
    /**
     * Activate/deactivate a breakpoint
     *
     * @param bpline string with breakpoint line number
     *
     * @returns string "ADDED" or "REMOVED" or error
     */
    toggleBreakpoint(bpline) {
        if (this.currSlotContract === undefined) {
            return 'No contract deployed..';
        }
        if (Contracts[this.currSlotContract].getNextInstructionLine(bpline) !== bpline) {
            return `Line ${bpline} is not an instruction. Breakpoint NOT added.`;
        }
        if (this.breakpoints.find(item => item === bpline) === undefined) {
            this.breakpoints.push(bpline);
            return 'ADDED';
        }
        else {
            this.breakpoints = this.breakpoints.filter(item => item !== bpline);
            return 'REMOVED';
        }
    }
    /**
     * Clear all breakpoints
     */
    clearAllBreakpoints() {
        this.breakpoints = [];
    }
    /**
     * Get breakpoints
     */
    getBreakpoints() {
        return this.breakpoints;
    }
    /**
     * Runs contract currently debuggable
     */
    runSlotContract() {
        if (this.currSlotContract === undefined) {
            return 'Deploy contract before run...';
        }
        return Contracts[this.currSlotContract].run(this.breakpoints);
    }
    /**
     * Steps contract currently debuggable
     */
    stepSlotContract() {
        if (this.currSlotContract === undefined) {
            return 'Deploy contract before step...';
        }
        return Contracts[this.currSlotContract].step(this.breakpoints);
    }
    /**
     *
     * @returns Number of contracts currently deployed. -1 if none deployed
     */
    getNumberOfContracts() {
        return Contracts.length - 1;
    }
    /**
     * Deploy a new contract
     *
     * @param asmSourceCode new contract source code to be deployed
     */
    deploy(asmSourceCode) {
        const newContract = new CONTRACT(asmSourceCode);
        this.currSlotContract = Contracts.push(newContract) - 1;
        Blockchain.addBalanceTo(newContract.contract, Constants.deploy_add_balance);
        newContract.forgeBlock();
        this.updateLastMemoryValues();
        this.clearAllBreakpoints();
    }
    updateLastMemoryValues() {
        if (this.currSlotContract === undefined) {
            return;
        }
        this.lastUpdateMemory = [];
        Contracts[this.currSlotContract].Memory.forEach(item => {
            this.lastUpdateMemory.push({ varName: item.varName, value: item.value });
        });
        for (let i = 0; i < 4; i++) {
            this.lastA[i] = Contracts[this.currSlotContract].A[i];
            this.lastB[i] = Contracts[this.currSlotContract].B[i];
        }
    }
}
