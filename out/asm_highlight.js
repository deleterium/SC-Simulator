// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License
// Some parts based on w3schools code for highlighting howto
// Function takes assembly text and outputs it with highlight codes in html
export class AsmHighlight {
    /**
     *
     * @param assemblySource
     * @param addDivLine true: add a <div> for every line; false: add <br>
     * @returns HTML string
     */
    static toHTML(assemblySource, addDivLine = true) {
        let iFound; // instruction Found
        let i, j; // iterators
        let parts; // to store string splitted
        // process line by line
        const line = assemblySource.split('\n');
        let ret = '';
        // loop thru all lines
        for (i = 0; i < line.length; i++) {
            iFound = false;
            if (addDivLine === true) {
                ret += `<div id='codeline${i}' class='line'>`;
            }
            // loop thru all regex expressions
            for (j = 0; j < this.allowedCodes.length; j++) {
                // we have a matching regex expression
                parts = this.allowedCodes[j].regex.exec(line[i]);
                if (parts !== null) {
                    iFound = true;
                    switch (this.allowedCodes[j].opCode) {
                        case 0xf0: // is empty line
                            ret += line[i];
                            break;
                        case 0xf1: // is label line
                            ret += this.toSpan(parts[0], this.config.spanLabelClass);
                            break;
                        case 0xf2: // comment
                            ret += this.toSpan(parts[1], this.config.spanDirectiveClass) +
                                this.toSpan(parts[2], this.config.spanCommentClass);
                            break;
                        case 0xf3: // declare
                            ret += this.toSpan(parts[1], this.config.spanDirectiveClass) +
                                this.toSpan(parts[2], this.config.spanVariableClass);
                            break;
                        case 0xf4: // const
                            ret += this.toSpan(parts[1], this.config.spanDirectiveClass) +
                                this.toHTML(parts[2], false).trim();
                            break;
                        case 0xf5: // program
                            ret += this.toSpan(parts[1], this.config.spanDirectiveClass) +
                                parts[2];
                            break;
                        case 0x01:
                            ret += this.toSpan(parts[1], this.config.spanInstructionClass) +
                                this.toSpan(parts[2], this.config.spanVariableClass) +
                                this.toSpan(parts[3], this.config.spanNumberClass);
                            break;
                        case 0x02:
                        case 0x06:
                        case 0x07:
                        case 0x08:
                        case 0x09:
                        case 0x0a:
                        case 0x0b:
                        case 0x0c:
                        case 0x16:
                        case 0x17:
                        case 0x18:
                            ret += this.toSpan(parts[1], this.config.spanInstructionClass) +
                                this.toSpan(parts[2], this.config.spanVariableClass) +
                                this.toSpan(parts[3], this.config.spanVariableClass);
                            break;
                        case 0x03:
                        case 0x04:
                        case 0x05:
                        case 0x0d:
                        case 0x10:
                        case 0x11:
                        case 0x25:
                        case 0x26:
                        case 0x27:
                            ret += this.toSpan(parts[1], this.config.spanInstructionClass) +
                                this.toSpan(parts[2], this.config.spanVariableClass);
                            break;
                        case 0x13:
                        case 0x28:
                        case 0x29:
                        case 0x30:
                        case 0x7f:
                            ret += this.toSpan(parts[0], this.config.spanInstructionClass);
                            break;
                        case 0x0e:
                            ret += this.toSpan(parts[1], this.config.spanInstructionClass) +
                                this.toSpan(parts[2], this.config.spanVariableClass) +
                                parts[3] +
                                this.toSpan(parts[4], this.config.spanVariableClass) +
                                parts[5];
                            break;
                        case 0x0f:
                            ret += this.toSpan(parts[1], this.config.spanInstructionClass) +
                                this.toSpan(parts[2], this.config.spanVariableClass) +
                                parts[3] +
                                this.toSpan(parts[4], this.config.spanVariableClass) +
                                parts[5] +
                                this.toSpan(parts[6], this.config.spanVariableClass) +
                                parts[7];
                            break;
                        case 0x14:
                            ret += this.toSpan(parts[1], this.config.spanInstructionClass) +
                                parts[2] +
                                this.toSpan(parts[3], this.config.spanVariableClass) +
                                parts[4] +
                                this.toSpan(parts[5], this.config.spanVariableClass);
                            break;
                        case 0x15:
                            ret += this.toSpan(parts[1], this.config.spanInstructionClass) +
                                parts[2] +
                                this.toSpan(parts[3], this.config.spanVariableClass) +
                                parts[4] +
                                this.toSpan(parts[5], this.config.spanVariableClass) +
                                parts[6] +
                                this.toSpan(parts[7], this.config.spanVariableClass);
                            break;
                        case 0x12:
                        case 0x1a:
                        case 0x2b:
                            ret += this.toSpan(parts[1], this.config.spanInstructionClass) +
                                this.toSpan(parts[2], this.config.spanLabelClass);
                            break;
                        case 0x1b:
                        case 0x1e:
                            ret += this.toSpan(parts[1], this.config.spanInstructionClass) +
                                this.toSpan(parts[2], this.config.spanVariableClass) +
                                this.toSpan(parts[3], this.config.spanLabelClass);
                            break;
                        case 0x1f:
                        case 0x20:
                        case 0x21:
                        case 0x22:
                        case 0x23:
                        case 0x24:
                            ret += this.toSpan(parts[1], this.config.spanInstructionClass) +
                                this.toSpan(parts[2], this.config.spanVariableClass) +
                                this.toSpan(parts[3], this.config.spanVariableClass) +
                                this.toSpan(parts[4], this.config.spanLabelClass);
                            break;
                        case 0x32:
                            if (!this.isFunction(parts[2].trim())) {
                                ret += this.toSpan(parts[1], this.config.spanInstructionClass) +
                                    this.toSpan(parts[2], this.config.spanErrorClass);
                            }
                            else {
                                ret += this.toSpan(parts[0], this.config.spanInstructionClass);
                            }
                            break;
                        case 0x33:
                            if (!this.isFunction(parts[2].trim())) {
                                ret += this.toSpan(parts[1], this.config.spanInstructionClass) +
                                    this.toSpan(parts[2], this.config.spanErrorClass) +
                                    this.toSpan(parts[3], this.config.spanVariableClass);
                            }
                            else {
                                ret += this.toSpan(parts[1] + parts[2], this.config.spanInstructionClass) +
                                    this.toSpan(parts[3], this.config.spanVariableClass);
                            }
                            break;
                        case 0x34:
                            if (!this.isFunction(parts[2].trim())) {
                                ret += this.toSpan(parts[1], this.config.spanInstructionClass) +
                                    this.toSpan(parts[2], this.config.spanErrorClass) +
                                    this.toSpan(parts[3], this.config.spanVariableClass) +
                                    this.toSpan(parts[4], this.config.spanVariableClass);
                            }
                            else {
                                ret += this.toSpan(parts[1] + parts[2], this.config.spanInstructionClass) +
                                    this.toSpan(parts[3], this.config.spanVariableClass) +
                                    this.toSpan(parts[4], this.config.spanVariableClass);
                            }
                            break;
                        case 0x35:
                            if (!this.isFunction(parts[3].trim())) {
                                ret += this.toSpan(parts[1], this.config.spanInstructionClass) +
                                    this.toSpan(parts[2], this.config.spanVariableClass) +
                                    this.toSpan(parts[3], this.config.spanErrorClass);
                            }
                            else {
                                ret += this.toSpan(parts[1], this.config.spanInstructionClass) +
                                    this.toSpan(parts[2], this.config.spanVariableClass) +
                                    this.toSpan(parts[3], this.config.spanInstructionClass);
                            }
                            break;
                        case 0x37:
                            if (!this.isFunction(parts[3].trim())) {
                                ret += this.toSpan(parts[1], this.config.spanInstructionClass) +
                                    this.toSpan(parts[2], this.config.spanVariableClass) +
                                    this.toSpan(parts[3], this.config.spanInstructionClass) +
                                    this.toSpan(parts[4], this.config.spanVariableClass) +
                                    this.toSpan(parts[5], this.config.spanVariableClass);
                            }
                            else {
                                ret += this.toSpan(parts[1], this.config.spanInstructionClass) +
                                    this.toSpan(parts[2], this.config.spanVariableClass) +
                                    this.toSpan(parts[3], this.config.spanErrorClass) +
                                    this.toSpan(parts[4], this.config.spanVariableClass) +
                                    this.toSpan(parts[5], this.config.spanVariableClass);
                            }
                            break;
                        case 0x36:
                        default:
                            // this should never be reached
                            ret += this.toSpan(line[i], this.config.spanErrorClass);
                    }
                    break;
                }
            }
            // If nothing found it's an error
            if (iFound === false) {
                ret += this.toSpan(line[i], this.config.spanErrorClass);
            }
            if (addDivLine === true) {
                ret += '</div>';
            }
            else {
                ret += '<br>';
            }
        }
        return ret;
    }
    static isFunction(text) {
        for (let k = 0; k < this.allowedFunctions.length; k++) {
            if (text === this.allowedFunctions[k].fnName) {
                return true;
            }
        }
        return false;
    }
    static toSpan(text, classname) {
        return `<span class='${classname}'>${text}</span>`;
    }
}
AsmHighlight.config = {
    divId: 'codeline',
    divClass: 'line',
    spanErrorClass: 'asmError',
    spanLabelClass: 'asmLabel',
    spanNumberClass: 'asmNumber',
    spanCommentClass: 'asmComment',
    spanVariableClass: 'asmVariable',
    spanDirectiveClass: 'asmDirective',
    spanInstructionClass: 'asmInstruction'
};
AsmHighlight.allowedCodes = [
    { opCode: 0xf0, size: 0, regex: /^\s*$/ },
    { opCode: 0xf1, size: 0, regex: /^\s*(\w+):\s*$/ },
    { opCode: 0xf2, size: 0, regex: /^(\s*\^comment)(\s+.*)/ },
    { opCode: 0xf3, size: 0, regex: /^(\s*\^declare)(\s+\w+\s*)$/ },
    { opCode: 0xf4, size: 0, regex: /^(\s*\^const)(\s+.*)/ },
    { opCode: 0xf5, size: 0, regex: /^(\s*\^program\s+\w+)(\s+[\s\S]+)$/ },
    { opCode: 0x01, size: 13, regex: /^(\s*SET\s+)(@\w+\s+)(#[\da-f]{16}\b\s*)$/ },
    { opCode: 0x02, size: 9, regex: /^(\s*SET\s+)(@\w+\s+)(\$\w+\s*)$/ },
    { opCode: 0x03, size: 5, regex: /^(\s*CLR\s+)(@\w+\s*)$/ },
    { opCode: 0x04, size: 5, regex: /^(\s*INC\s+)(@\w+\s*)$/ },
    { opCode: 0x05, size: 5, regex: /^(\s*DEC\s+)(@\w+\s*)$/ },
    { opCode: 0x06, size: 9, regex: /^(\s*ADD\s+)(@\w+\s+)(\$\w+\s*)$/ },
    { opCode: 0x07, size: 9, regex: /^(\s*SUB\s+)(@\w+\s+)(\$\w+\s*)$/ },
    { opCode: 0x08, size: 9, regex: /^(\s*MUL\s+)(@\w+\s+)(\$\w+\s*)$/ },
    { opCode: 0x09, size: 9, regex: /^(\s*DIV\s+)(@\w+\s+)(\$\w+\s*)$/ },
    { opCode: 0x0a, size: 9, regex: /^(\s*BOR\s+)(@\w+\s+)(\$\w+\s*)$/ },
    { opCode: 0x0b, size: 9, regex: /^(\s*AND\s+)(@\w+\s+)(\$\w+\s*)$/ },
    { opCode: 0x0c, size: 9, regex: /^(\s*XOR\s+)(@\w+\s+)(\$\w+\s*)$/ },
    { opCode: 0x0d, size: 5, regex: /^(\s*NOT\s+)(@\w+\s*)$/ },
    { opCode: 0x0e, size: 9, regex: /^(\s*SET\s+)(@\w+)(\s+\$\()(\$\w+)(\)\s*)$/ },
    { opCode: 0x0f, size: 13, regex: /^(\s*SET\s+)(@\w+\s+)(\$\()(\$\w+)(\s*\+\s*)(\$\w+)(\)\s*)$/ },
    { opCode: 0x10, size: 5, regex: /^(\s*PSH\s+)(\$\w+\s*)$/ },
    { opCode: 0x11, size: 5, regex: /^(\s*POP\s+)(@\w+\s*)$/ },
    { opCode: 0x12, size: 5, regex: /^(\s*JSR\s+)(:\w+\s*)$/ },
    { opCode: 0x13, size: 1, regex: /^\s*RET\s*$/ },
    { opCode: 0x14, size: 9, regex: /^(\s*SET\s+)(@\()(\$\w+)(\)\s+)(\$\w+\s*)$/ },
    { opCode: 0x15, size: 13, regex: /^(\s*SET\s+)(@\()(\$\w+)(\s*\+\s*)(\$\w+)(\)\s+)(\$\w+\s*)$/ },
    { opCode: 0x16, size: 9, regex: /^(\s*MOD\s+)(@\w+\s+)(\$\w+\s*)$/ },
    { opCode: 0x17, size: 9, regex: /^(\s*SHL\s+)(@\w+\s+)(\$\w+\s*)$/ },
    { opCode: 0x18, size: 9, regex: /^(\s*SHR\s+)(@\w+\s+)(\$\w+\s*)$/ },
    { opCode: 0x1a, size: 5, regex: /^(\s*JMP\s+)(:\w+\s*)$/ },
    { opCode: 0x1b, size: 6, regex: /^(\s*BZR\s+)(\$\w+\s+)(:\w+\s*)$/ },
    { opCode: 0x1e, size: 6, regex: /^(\s*BNZ\s+)(\$\w+\s+)(:\w+\s*)$/ },
    { opCode: 0x1f, size: 10, regex: /^(\s*BGT\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/ },
    { opCode: 0x20, size: 10, regex: /^(\s*BLT\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/ },
    { opCode: 0x21, size: 10, regex: /^(\s*BGE\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/ },
    { opCode: 0x22, size: 10, regex: /^(\s*BLE\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/ },
    { opCode: 0x23, size: 10, regex: /^(\s*BEQ\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/ },
    { opCode: 0x24, size: 10, regex: /^(\s*BNE\s+)(\$\w+\s+)(\$\w+\s+)(:\w+\s*)$/ },
    { opCode: 0x25, size: 5, regex: /^(\s*SLP\s+)(\$\w+\s*)$/ },
    { opCode: 0x26, size: 5, regex: /^(\s*FIZ\s+)(\$\w+\s*)$/ },
    { opCode: 0x27, size: 5, regex: /^(\s*STZ\s+)(\$\w+\s*)$/ },
    { opCode: 0x28, size: 1, regex: /^\s*FIN\s*$/ },
    { opCode: 0x29, size: 1, regex: /^\s*STP\s*$/ },
    { opCode: 0x2b, size: 5, regex: /^(\s*ERR\s+)(:\w+\s*)$/ },
    { opCode: 0x30, size: 1, regex: /^\s*PCS\s*$/ },
    { opCode: 0x32, size: 3, regex: /^(\s*FUN\s+)(\w+\s*)$/ },
    { opCode: 0x33, size: 7, regex: /^(\s*FUN\s+)(\w+\s+)(\$\w+\s*)$/ },
    { opCode: 0x34, size: 11, regex: /^(\s*FUN\s+)(\w+\s+)(\$\w+\s+)(\$(\w+)\s*)$/ },
    { opCode: 0x35, size: 7, regex: /^(\s*FUN\s+)(@\w+\s+)(\w+\s*)$/ },
    { opCode: 0x36, size: 11, regex: /^\s*(FUN)\s+@(\w+)\s+(\w+)\s+\$(\w+)\s*$/ },
    { opCode: 0x37, size: 15, regex: /^(\s*FUN\s+)(@\w+\s+)(\w+\s+)(\$\w+\s+)(\$\w+\s*)$/ },
    { opCode: 0x7f, size: 1, regex: /^\s*NOP\s*$/ }
];
AsmHighlight.allowedFunctions = [
    { fnCode: 0x0100, fnName: 'get_A1' },
    { fnCode: 0x0101, fnName: 'get_A2' },
    { fnCode: 0x0102, fnName: 'get_A3' },
    { fnCode: 0x0103, fnName: 'get_A4' },
    { fnCode: 0x0104, fnName: 'get_B1' },
    { fnCode: 0x0105, fnName: 'get_B2' },
    { fnCode: 0x0106, fnName: 'get_B3' },
    { fnCode: 0x0107, fnName: 'get_B4' },
    { fnCode: 0x0110, fnName: 'set_A1' },
    { fnCode: 0x0111, fnName: 'set_A2' },
    { fnCode: 0x0112, fnName: 'set_A3' },
    { fnCode: 0x0113, fnName: 'set_A4' },
    { fnCode: 0x0114, fnName: 'set_A1_A2' },
    { fnCode: 0x0115, fnName: 'set_A3_A4' },
    { fnCode: 0x0116, fnName: 'set_B1' },
    { fnCode: 0x0117, fnName: 'set_B2' },
    { fnCode: 0x0118, fnName: 'set_B3' },
    { fnCode: 0x0119, fnName: 'set_B4' },
    { fnCode: 0x011a, fnName: 'set_B1_B2' },
    { fnCode: 0x011b, fnName: 'set_B3_B4' },
    { fnCode: 0x0120, fnName: 'clear_A' },
    { fnCode: 0x0121, fnName: 'clear_B' },
    { fnCode: 0x0122, fnName: 'clear_A_B' },
    { fnCode: 0x0123, fnName: 'copy_A_From_B' },
    { fnCode: 0x0124, fnName: 'copy_B_From_A' },
    { fnCode: 0x0125, fnName: 'check_A_Is_Zero' },
    { fnCode: 0x0126, fnName: 'check_B_Is_Zero' },
    { fnCode: 0x0127, fnName: 'check_A_equals_B' },
    { fnCode: 0x0128, fnName: 'swap_A_and_B' },
    { fnCode: 0x0129, fnName: 'OR_A_with_B' },
    { fnCode: 0x012a, fnName: 'OR_B_with_A' },
    { fnCode: 0x012b, fnName: 'AND_A_with_B' },
    { fnCode: 0x012c, fnName: 'AND_B_with_A' },
    { fnCode: 0x012d, fnName: 'XOR_A_with_B' },
    { fnCode: 0x012e, fnName: 'XOR_B_with_A' },
    { fnCode: 0x0140, fnName: 'add_A_to_B' },
    { fnCode: 0x0141, fnName: 'add_B_to_A' },
    { fnCode: 0x0142, fnName: 'sub_A_from_B' },
    { fnCode: 0x0143, fnName: 'sub_B_from_A' },
    { fnCode: 0x0144, fnName: 'mul_A_by_B' },
    { fnCode: 0x0145, fnName: 'mul_B_by_A' },
    { fnCode: 0x0146, fnName: 'div_A_by_B' },
    { fnCode: 0x0147, fnName: 'div_B_by_A' },
    { fnCode: 0x0200, fnName: 'MD5_A_to_B' },
    { fnCode: 0x0201, fnName: 'check_MD5_A_with_B' },
    { fnCode: 0x0202, fnName: 'HASH160_A_to_B' },
    { fnCode: 0x0203, fnName: 'check_HASH160_A_with_B' },
    { fnCode: 0x0204, fnName: 'SHA256_A_to_B' },
    { fnCode: 0x0205, fnName: 'check_SHA256_A_with_B' },
    { fnCode: 0x0300, fnName: 'get_Block_Timestamp' },
    { fnCode: 0x0301, fnName: 'get_Creation_Timestamp' },
    { fnCode: 0x0302, fnName: 'get_Last_Block_Timestamp' },
    { fnCode: 0x0303, fnName: 'put_Last_Block_Hash_In_A' },
    { fnCode: 0x0304, fnName: 'A_to_Tx_after_Timestamp' },
    { fnCode: 0x0305, fnName: 'get_Type_for_Tx_in_A' },
    { fnCode: 0x0306, fnName: 'get_Amount_for_Tx_in_A' },
    { fnCode: 0x0307, fnName: 'get_Timestamp_for_Tx_in_A' },
    { fnCode: 0x0308, fnName: 'get_Ticket_Id_for_Tx_in_A' },
    { fnCode: 0x0309, fnName: 'message_from_Tx_in_A_to_B' },
    { fnCode: 0x030a, fnName: 'B_to_Address_of_Tx_in_A' },
    { fnCode: 0x030b, fnName: 'B_to_Address_of_Creator' },
    { fnCode: 0x0400, fnName: 'get_Current_Balance' },
    { fnCode: 0x0401, fnName: 'get_Previous_Balance' },
    { fnCode: 0x0402, fnName: 'send_to_Address_in_B' },
    { fnCode: 0x0403, fnName: 'send_All_to_Address_in_B' },
    { fnCode: 0x0404, fnName: 'send_Old_to_Address_in_B' },
    { fnCode: 0x0405, fnName: 'send_A_to_Address_in_B' },
    { fnCode: 0x0406, fnName: 'add_Minutes_to_Timestamp' }
];
