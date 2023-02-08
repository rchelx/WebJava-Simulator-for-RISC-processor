/*
The MIT License (MIT)
Copyright (c) 2013 Oskar Ojala
See LICENSE for details
*/

"use strict";

function throwDecodeEx(msg) {
    throw { 
        name: 'DecodeError',
        message: msg
    }
}

var concode = ""; var originalinstrcount = 0, pipecycles = 0, check = 0, randomcount = 0;

function readProgram(vm, program) {
    function removeComments(line) {
        return line.indexOf(';') !== -1 ? line.slice(0, line.indexOf(';')) : line
    }
    function trim(line) {
        return line.trim()
    }
    function removeEmptyLines(line) {
        return line.length > 0
    }
    function convertlinesUpperCase(line) {
        return line.toUpperCase();
    }

    var target = "";
    
    var lines = program.replace(/\r/g, '').split("\n").map(removeComments).map(trim).filter(removeEmptyLines).map(convertlinesUpperCase)
   
    var instrs = lines.map(function (line, idx) {
        var branchindex;

        for (var x in condCodes) {
         /*   if (line.includes("B" + x)) {
                document.getElementById('lineval').textContent = idx;
                document.getElementById('olineval').textContent = idx;
                document.getElementById('tlineval').textContent = idx;
                target = line;
                concode = "B" + x;
                branchindex = idx;
            }*/
        }

        var str = "";
        if (!!target) {
            str = target.split(" ");
        }
        var targetindex;

        if (!line.includes(concode)) {
            targetindex = idx;
        }

        if (concode) {
            if (method == 1) {
                staticbranchpredict(targetindex);
            }

            if (method == 2) {
                onedynamicbranchpredict(targetindex);
            }

            if (method == 3) {
                var newstate = dec2bin(2);
                twodynamicbranchpredict(targetindex);
            }
        }
        document.getElementById('noOfInstr').style.display = "block";
        originalinstrcount = idx + 1;
       
        return parseLine(line, idx)
    })
    return { ops: instrs, labels: calculateLabels(instrs) }
}

function staticbranchpredict(targetidx) {
    var predictval = document.getElementById("predict");
    var text = predictval.options[predictval.selectedIndex].value;
    document.getElementById('predictval').textContent = text;
    var branchidx = document.getElementById('lineval').textContent;

    if (branchidx == targetidx) {
        if (text == "NT") {
            document.getElementById('correctval').textContent = "1";
            document.getElementById('incorrectval').textContent = "0";
            document.getElementById('accuracyval').textContent = (Math.round((10 * 10) * 100) / 100).toFixed(2);
        }
        if (text == "T") {
            document.getElementById('correctval').textContent = "0";
            document.getElementById('incorrectval').textContent = "1";
            document.getElementById('accuracyval').textContent = (Math.round(0 * 100) / 100).toFixed(2);
        }
    }
    if (branchidx > targetidx) {
        if (text == "NT") {
            document.getElementById('correctval').textContent = "0";
            document.getElementById('incorrectval').textContent = "1";
            document.getElementById('accuracyval').textContent = (Math.round(0 * 100) / 100).toFixed(2);
        }
        if (text == "T") {
            document.getElementById('correctval').textContent = "1";
            document.getElementById('incorrectval').textContent = "0";
            document.getElementById('accuracyval').textContent = (Math.round(10 * 100) / 100).toFixed(2);
        }
    }
    if (branchidx < targetidx) {
        if (text == "NT") {
            document.getElementById('correctval').textContent = "1";
            document.getElementById('incorrectval').textContent = "0";
            document.getElementById('accuracyval').textContent = (Math.round((10 * 10) * 100) / 100).toFixed(2);
        }
        if (text == "T") {
            document.getElementById('correctval').textContent = "0";
            document.getElementById('incorrectval').textContent = "1";
            document.getElementById('accuracyval').textContent = (Math.round(0 * 100) / 100).toFixed(2);
        }
    }
}

function onedynamicbranchpredict(targetidx) {
    var predictval = document.getElementById("predict");
    var text = predictval.options[predictval.selectedIndex].value;
    document.getElementById('opredictval').textContent = text;
    var branchidx = document.getElementById('lineval').textContent;
    document.getElementById('oactualval').textContent = "NT";

    document.getElementById('ohistoryval').textContent = "-";

    var onebittable = document.getElementById("1bitpredictiontable");

    var lastRow = onebittable.rows.length - 1;

    if (lastRow == 2) {
        onebittable.deleteRow(lastRow);
    }

    if (text == "NT") {
        document.getElementById('ocorrectval').textContent = "1";
        document.getElementById('oincorrectval').textContent = "0";
        document.getElementById('oaccuracyval').textContent = (Math.round(100 * 100) / 100).toFixed(2);
    }

    if (text == "T") {
        document.getElementById('ocorrectval').textContent = "0";
        document.getElementById('oincorrectval').textContent = "1";
        document.getElementById('oaccuracyval').textContent = (Math.round(0 * 100) / 100).toFixed(2);
    }
}

function twodynamicbranchpredict(targetidx) {
    var predictval = document.getElementById("predict");
    var text = predictval.options[predictval.selectedIndex].value;
    document.getElementById('tpredictval').textContent = text;
    var branchidx = document.getElementById('lineval').textContent;
    document.getElementById('tactualval').textContent = "NT";
    document.getElementById('thistoryval').textContent = "-";
    document.getElementById('tstateval').textContent = "00";
    document.getElementById('tloopval').textContent = "-";

    var secondtable = document.getElementById("2bitpredictiontable");
    var twolastRow = secondtable.rows.length - 1;

    if (twolastRow == 2) {
        secondtable.deleteRow(twolastRow);
    }
    
    if (text == "NT") {
        document.getElementById('tcorrectval').textContent = "1";
        document.getElementById('tincorrectval').textContent = "0";
        document.getElementById('taccuracyval').textContent = (Math.round(100 * 100) / 100).toFixed(2);
    }

    if (text == "T") {
        document.getElementById('tcorrectval').textContent = "0";
        document.getElementById('tincorrectval').textContent = "1";
        document.getElementById('taccuracyval').textContent = (Math.round(0 * 100) / 100).toFixed(2);
    }
}

function calculateLabels(instrs) {
    var labels = {}
    for (var i = 0; i < instrs.length; i++) {
        if (instrs[i].label)
            labels[instrs[i].label] = i
    }
    return labels
}

function parseLine(line, lineNumber) {
    var tokens = tokenize(line, lineNumber)
    return decodeOp(tokens, lineNumber)
}

function tokenize(line, lineNumber) {
    function orReducer(memo, val) {
        return memo + '|' + val
    }
    var labelRE = '[A-Za-z0-9]+'
    var labelDecRE = '(?:(' + labelRE + ')\\s+)?'
    var allInstrs = listAllOps().reduce(orReducer)
    var allConds = Object.keys(condCodes).reduce(orReducer)
    var instrRE = '(' + allInstrs + ')(' + allConds + ')?(S)?' // FIXME reverse S and cond
    //var immediateRE = '#\\d+'

    var nameRE = '[^,\\s]+'
   /* var op3RE = '[A-Za-z]{3}'
    var registerRE = '[rR]\\d\\d?'*/
    var asmLineRE = new RegExp(labelDecRE + instrRE + '\\s+(' + nameRE + ')\\s*(.*)$')

    //var flexOp2RE = '(#\\d+|' + registerRE + '|' + registerRE + '), (' + op3RE + '(?: (?:' + registerRE + '|#\\d+))?)'
    //var asmArgsRE = new RegExp('(?:,\\s*(' + nameRE +'))?(?:, ' + flexOp2RE + ')?')

    var out = asmLineRE.exec(line)
    if (!out)
        throwDecodeEx("Invalid instruction format '" + line + "', line " + lineNumber);
    var srcArgs = out[6].split(/[, ]+/).filter(function (s) { return s.length > 0 })
    out[6] = srcArgs
    return out
}

var prevtarget = '', prevsource = '', prevop = '', prevprevop = '', branchop = '';
var rawcount = 0, warcount = 0, stallcount = 0, wawcount = 0, chcount = 0, finalnum = 0, prevcount = 0, prevcountstalls = 0;
const rawitems = [], branchitems = [], targettemp = [], targettempnum = [], prevstallitems = [], prevstallitemsunique = [];
var branchnum = 0, targetnum = 0; var targetlabel = ''; var checkcount = 0;

function decodeOp(tokens, lineNumber) {
    function hasShift() {
        var shiftsRE = new RegExp(Object.keys(shiftOps).reduce(function (memo, val) { return memo + '|' + val }))
        return function (srcs) {
            for (var i = 0; i < srcs.length; ++i) {
                if (shiftsRE.test(srcs[i]))
                    return i
            }
            return -1
        }
    }
    // The result of the shift operation is used as Operand2 in the instruction, but Rm itself is not altered.
    // http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.dui0204j/Cihbeage.html
    function decodeSources(srcs) {

        var ishift = hasShift()(srcs)
        if (ishift != -1) {
            var sf = shiftOps[srcs[ishift]]
            var sourceUpdater = function (argResolver) { return sf(undefined, [argResolver(srcs[ishift - 1]), argResolver(srcs[ishift + 1])]) }
            var plainRegs = srcs.slice(0, ishift - 1)
            plainRegs.push(sourceUpdater)
            return plainRegs
        }
        return srcs
    }

    var op = tokens[2];
    var sources = decodeSources(tokens[6]);
    var target = tokens[5];
    var textnoOfStalls = document.getElementById("noOfStallsCount");
    var label = tokens[1]
    var condCode = tokens[3]
    var updateApsr = tokens[4] === 'S' ? apsrUpdateMode(op) : undefined
    prevop = op;

    var op = makeOp(lineNumber, label, op, target, sources, condCode, updateApsr, execForOp(op))

    if (op.label !== undefined) {
        targettemp.push(op.label);
        targettempnum.push(op.addr);
    }

    for (var i = 0; i < targettemp.length; i++) {
        for (var k = 0; k < targettempnum.length; k++) {
            if (targettemp[i] === targetlabel) {
                console.log(targettempnum[i]);
                targetnum = targettempnum[i];
            }
        }
    }

    finalnum = Math.abs(targetnum - branchnum) + 1;
    return op
}

// TODO binary numbers
var condCodes = {
    'AL': '1110', 'NV': '1111',
    'EQ': '0000', 'NE': '0001',
    'CS': '0010', 'HS': '0010', 'CC': '0011', 'LO': '0011',
    'MI': '0100', 'PL': '0101',
    'VS': '0110', 'VC': '0111',
    'HI': '1000', 'LS': '1001',
    'GE': '1010', 'LT': '1011', 'GT': '1100', 'LE': '1101'
}

var arithmeticOps = {
    'ADD': function (vm, s) { return s[0] + s[1] },
    'ADDI': function (vm, s) { return s[0] + s[1] },
    'ADDC': function (vm, s) { return s[0] + s[1] },
    'ADC': function (vm, s) { return s[0] + s[1] + vm.getCpsrC() },
    'SUB': function (vm, s) { return s[0] - s[1] },
    'SUBI': function (vm, s) { return s[0] - s[1] },
    'SBC': function (vm, s) { return s[0] - s[1] + vm.getCpsrC() - 1 },
    'RSB': function (vm, s) { return s[1] - s[0] },
    'RSC': function (vm, s) { return s[1] - s[0] + vm.getCpsrC() - 1 }
}

var bitwiseOps = {
    'AND': function (vm, s) { return s[0] & s[1] },
    'EOR': function (vm, s) { return s[0] ^ s[1] },
    'ORR': function (vm, s) { return s[0] | s[1] },
    'BIC': function (vm, s) { return s[0] & ~s[1] }
}

var moveOps = {
    'MOV': function (vm, s, source) { return s[0] },
    'MVN': function (vm, s) { return ~s[0] }
}

var comparisonOps = {
    'CMP': function (vm, s) { vm.updateApsr(s[0] - s[1], 'SUB') },
    'CMN': function (vm, s) { vm.updateApsr(s[0] + s[1], 'ADD') },
    'TST': function (vm, s) { vm.updateApsr(s[0] & s[1], 'SHIFT') },
    'TEQ': function (vm, s) { vm.updateApsr(s[0] ^ s[1], 'SHIFT') }
}

// immediates are not supported, result cannot be first source, p.55
/*var multiplies = ['MUL', 'MLA']*/

var shiftOps = {
    'LSL': function (vm, s) { return s[0] << s[1] },
    'LSR': function (vm, s) { return s[0] >>> s[1] },
    'ASR': function (vm, s, source) { return s[0] >> s[1] },
    'ROR': function (vm, s) { return 0; }, // TODO
    'RRX': function (vm, s) { return 0; } // TODO
} // TODO

// TODO ADR, LDRB
var loadStoreOps = {
    'LDR': function (vm, s, source) { console.log(source + "love"); source = source.toString().replace(/[\[\]']+/g, '');return vm.readMem32("0x" + source);},
    'LDUR': function (vm, s, source) {
        source = source.toString().replace(/[\[\]']+/g, '');
        const sourceArray = source.split(",");
        if (sourceArray[1] != undefined) {
            var decimal = parseInt(sourceArray[1], 16)
            var updatedmemorysource = vm.readReg(sourceArray[0]) + decimal;
            return vm.readMem32("0x" + updatedmemorysource.toString(16));
        }
        else {
            return vm.readMem32("0x" + source);
        }
    },
    'STR': function (vm, s, source) { source = source.toString().replace(/[\[\]']+/g, ''); vm.writeMem32("0x" + source, s[0]); },
    'STUR': function (vm, s, source) {
        source = source.toString().replace(/[\[\]']+/g, '');
        const sourceArray = source.split(",");
        if (sourceArray[1] != undefined) {
            var decimal = parseInt(sourceArray[1], 16)
            var updatedmemorysource = vm.readReg(sourceArray[0]) + decimal;
            vm.writeMem32("0x" + updatedmemorysource.toString(16), s[0])
        }
        else {
            vm.writeMem32("0x" + source, s[0]);
        }
    }
}

var branchzerocheck = {
    'CBNZ': function (vm, target, source) {
        if (vm.readReg(target) != 0) {
            console.log(target + "fish");
            return source;
        }
    },
     'CBZ': function (vm, target, source) {
        if (vm.readReg(target) == 0) {
            console.log(target + "fish");
            return source;
        }
    }
}

// one operand
var branchOps = ['B']

function listAllOps() {
    return branchOps.concat(Object.keys(arithmeticOps),
        Object.keys(bitwiseOps),
        Object.keys(moveOps),
        Object.keys(comparisonOps),
        Object.keys(loadStoreOps),
        Object.keys(branchzerocheck))
}

function apsrUpdateMode(op) {
    switch (op) {
        case 'ADD':
        case 'ADDI':
        case 'ADDC':
        case 'SUBI':
        case 'ADC':
        case 'CMN':
            return 'ADD'
        case 'CMP':
        case 'SUB':
        case 'SBC':
        case 'RSB':
        case 'RSC':
            return 'SUB'
        case 'AND':
        case 'ORR':
        case 'EOR':
        case 'BIC':
        case 'MOV':
            return 'SHIFT'
        default:
            return 'OTHER'
    } 
}

function dec2bin(dec) {
    return (dec >>> 0).toString(2);
}

var tempcount = 0, tempstallcount = 0;

var bcount = 0, lcount = 0, rcount = 0, scount = 0, count = 0, cbnzcount = 0, cbzcount = 0;
var totalcount = 0, totalcycles = 0, cpi = 0, afteriterations = 0;

function execForOp(instr) {
    function makeRegUpdater(func) {
        return function (vm, op) {
            vm.updateReg(op.target, func(vm, op.resolveArgs(vm), op.sources), op.updateApsr)
        }
    }
    function makeComp(func) {
        return function (vm, op) {
            func(vm, op.targetlessArgs(vm))
        }
    }
    function makeStore(func) {
        return function (vm, op) {
            func(vm, op.targetlessArgs(vm), op.sources)
        }
    }

    function branchzero(func) {
        return function (vm, op) {
            return func(vm, op.target, op.sources)
        }
    }

    printinfo();

    switch (instr) {
        case 'ADD':
            if (instr == 'ADD') {
                rcount++;
            }
        case 'ADDI':
            if (instr == 'ADDI') {
                rcount++;
            }
        case 'ADDC':
            if (instr == 'ADDC') {
                rcount++;
            }
        case 'ADC':
            if (instr == 'ADC') {
                rcount++;
            }
        case 'SUB':
            if (instr == 'SUB') {
                rcount++;
            }
        case 'SUBI':
            if (instr == 'SUBI') {
                rcount++;
            }
        case 'SBC':
            if (instr == 'SBC') {
                rcount++;
            }
        case 'RSB':
            if (instr == 'RSB') {
                rcount++;
            }
        case 'RSC':
            if (instr == 'RSC') {
                rcount++;
            }
            return makeRegUpdater(arithmeticOps[instr])
        case 'LSL':
            if (instr == 'LSL') {
                rcount++;
            }
        case 'LSR':
            if (instr == 'LSR') {
                rcount++;
            }
        case 'ASR':
            if (instr == 'ASR') {
                rcount++;
            }
            return makeRegUpdater(shiftOps[instr])
        case 'MOV':
            if (instr == 'MOV') {
                rcount++; 
            }
            return makeRegUpdater(moveOps[instr])
        case 'CBZ':
            if (instr == 'CBZ') {
                if (bcount == 1) {
                    count++;
                }
                bcount++;
            }
            return branchzero(branchzerocheck[instr])
        case 'CBNZ':
            if (instr == 'CBNZ') {
                if (bcount == 1) {
                    count++;
                }
                bcount++;
            }
            return branchzero(branchzerocheck[instr])
        case 'CMP':
            if (instr == 'CMP') {
                rcount++;
            }
        case 'CMN':
            if (instr == 'CMN') {
                rcount++;
            }
        case 'TST':
            if (instr == 'TST') {
                rcount++;
            }
        case 'TEQ':
            if (instr == 'TEQ') {
                rcount++;
            }
            return makeComp(comparisonOps[instr])
        case 'LDR':
            if (instr == 'LDR') {
                lcount++;
            }
            return makeRegUpdater(loadStoreOps[instr])
        case 'LDUR':
            if (instr == 'LDUR') {
                lcount++;
            }
            return makeRegUpdater(loadStoreOps[instr])
        case 'STR':
            if (instr == 'STR') {
                scount++;
            }
            return makeStore(loadStoreOps[instr])
        case 'STUR':
            if (instr == 'STUR') {
                scount++;
            }
            return makeStore(loadStoreOps[instr])
        case 'B':
            if (instr == 'B') {
                bcount++;
            }
            return function (vm, op) {
                if (bcount == 1) {
                    count++;
                }
                return op.target
            }
    }
}
const prevprevregsource = [], prevprevregtarget = [];
function makeOp(addr, label, instr, target, sources, condCode, updateApsr, execF) {
    var opcode = 0
    return {
        opcode: opcode,
        addr: addr,
        label: label,
        instr: instr,
        target: target,
        sources: sources,
        condCode: condCode,
        updateApsr: updateApsr,

        getArgValue: function (vm) {
            return function (arg) {
                arg = arg.toUpperCase()

                if (arg.charAt(0) === 'R') {
                    return vm.readReg(arg)
                } else if ((instr.includes('ADDI') || instr.includes('SUBI')) && arg.charAt(0) === '#') {
                    throwDecodeEx("Invalid argument '" + arg + "', address " + addr);
                } else if (instr.includes('ADDI') || instr.includes('SUBI')) {
                    var numAsStr = arg.slice(0)
                    return arg.slice(0, 2) == '0X' ? parseInt(numAsStr, 16) : parseInt(numAsStr, 10)
                } else if (arg.charAt(0) === '#') {
                    numAsStr = arg.slice(1)
                    return arg.slice(1, 3) == '0X' ? parseInt(numAsStr, 16) : parseInt(numAsStr, 10)
                } else if (arg.charAt(0) === '[') { // TODO make the arg a function
                    return vm.readReg(arg.slice(1, 3))
                } else if (instr.includes('STUR') || instr.includes('LDUR')) {
                    return arg.slice(0, arg.length - 1)
                } else {
                    throwDecodeEx("Invalid argument '" + arg + "', address " + addr);
                }
            }
        },
        argResolve: function (vm) {
            var that = this
            return function (arg) {
                if (typeof arg === 'function') {
                    return arg(that.getArgValue(vm))
                } else {
                    return that.getArgValue(vm)(arg)
                }
            }
        },

        resolveArgs: function (vm) {
            var as = this.sources.map(this.argResolve(vm))
            return as
        },
        
        targetlessArgs: function (vm) {
            var sources = [this.target].concat(this.sources)
            var as = sources.map(this.argResolve(vm))
            return as
        },

        exec: function (vm) {
            var op = makeOp(addr, label, instr, target, sources, condCode, updateApsr, execF);
            var textnoOfStalls = document.getElementById("noOfStallsCount");
            var textnoOfCycles = document.getElementById("noOfCycles");

            prevprevregtarget.push(op.target);
            prevprevregsource.push(op.instr);
            prevcount++;

            if (prevcount >= 3) {
                for (var i = 0; i < prevprevregtarget.length; i++) {
                    if (prevcount - i == 3) {
                        if (prevprevregtarget[i] == op.target && op.instr != 'CMP' && prevprevregsource[i] != 'STUR' && op.instr != 'LDUR' && op.instr != 'CBNZ' && op.instr != 'CBZ') {
                            prevstallitems.push(randomcount);
                            prevcountstalls++;
                        }

                    }
                }
            }

            if ((prevop.instr == 'B' || prevop.instr == 'CBNZ' || prevop.instr == 'CBZ') && randomcount > op.addr) {
                branchitems.push(randomcount);
                stallcount = stallcount + 1;
                textnoOfStalls.textContent = stallcount;
            }

            if (op.instr.includes("LDUR")) {
                op.sources = op.sources.toString().replace(/[\[\]']+/g, '');
                const sourceArray = op.sources.split(",");
                if (sourceArray[1] != undefined) {
                    if (sourceArray[0] == prevtarget) {
                        rawcount++;
                        rawitems.push(randomcount);
                        console.log(rawitems);
                        stallcount = stallcount + 2;
                        textnoOfStalls.textContent = stallcount;
                        console.log("rawcount h1" + rawcount + op.instr + prevop.instr);
                        console.log("stallcount" + stallcount + op.instr + prevop.instr + randomcount);
                    }
                }
            }
            if (op.instr.includes("STUR")) {
                op.sources = op.sources.toString().replace(/[\[\]']+/g, '');
                const sourceArray = op.sources.split(",");
                if (sourceArray[1] != undefined) {
                    if (sourceArray[0] == prevtarget) {
                        rawcount++;
                        rawitems.push(randomcount);
                        console.log(rawitems);
                        stallcount = stallcount + 2;
                        textnoOfStalls.textContent = stallcount;
                        console.log("rawcount h1" + rawcount + op.instr + prevop.instr);
                        console.log("stallcount" + stallcount + op.instr + prevop.instr + randomcount);
                    }
                }
                else {
                    if (prevcount >= 3) {
                        for (var i = 0; i < prevprevregtarget.length; i++) {
                            if (prevcount - i == 3) {
                                if (prevprevregtarget[i] == sourceArray[0]) {
                                    prevstallitems.push(randomcount);
                                    prevcountstalls++;
                                }

                            }
                        }
                    }
                }
            }
            for (var i = 0; i < sources.length; i++) {
                if (prevtarget == sources[i]) {
                    if (sources.length == 0) {
                        console.log("undefined");
                    }
                    else {
                        if (prevop.instr != "CBNZ" && prevop.instr != "CBZ") {
                            rawcount++;
                            rawitems.push(randomcount);
                            stallcount = stallcount + 2;
                            textnoOfStalls.textContent = stallcount;
                            console.log("rawcount h1" + rawcount + op.instr + prevop.instr);
                            console.log("stallcount" + stallcount + op.instr + prevop.instr + randomcount);
                            break;
                        }
                    }
                }
            }

            if (prevtarget == target) {
                if (target.length == 0) {
                    console.log("undefined");
                }
                else if (op.instr.includes("CMP")) {
                    rawcount++;
                    rawitems.push(randomcount);
                    console.log(rawitems);
                    stallcount = stallcount + 2;
                    textnoOfStalls.textContent = stallcount;
                    console.log("rawcount h2" + rawcount + op.instr + prevop.instr);
                    console.log("stallcount" + stallcount + op.instr + prevop.instr + randomcount);
                }
                else if (op.instr.includes("STUR")) {
                    rawcount++;
                    rawitems.push(randomcount);
                    console.log(rawitems);
                    stallcount = stallcount + 2;
                    textnoOfStalls.textContent = stallcount;
                    console.log("rawcount h2" + rawcount + op.instr + prevop.instr);
                    console.log("stallcount" + stallcount + op.instr + prevop.instr + randomcount);
                }
                else if (op.instr.includes("LDUR")) {
                    wawcount++;
                    console.log("wawcount h2" + wawcount + op.instr + prevop.instr);
                }
                else {
                    if (prevop.instr != 'CBNZ' && prevop.instr != 'CBZ' && op.label == undefined) {
                        rawcount++;
                        rawitems.push(randomcount);
                        console.log(rawitems);
                        stallcount = stallcount + 2;
                        textnoOfStalls.textContent = stallcount;
                        console.log("rawcount h2" + rawcount + op.instr + prevop.instr + op.label);
                        console.log("stallcount" + stallcount + op.instr + prevop.instr + randomcount);
                    }
                }
            }

            for (var i = 0; i < prevsource.length; i++) {
                for (var k = 0; k < sources.length; k++) {
                    if (sources.length == 0) {
                        console.log("undefined");
                    }
                    else {
                        if (prevsource[i] == sources[k]) {
                            if ((op.instr.includes("STR") && prevop.instr.includes("LDR")) || (op.instr.includes("STUR") && prevop.instr.includes("LDUR"))) {
                                warcount++;
                                console.log("warcount h1" + warcount + op.instr + prevop.instr);
                                break;
                            }
                        }
                    }
                }
            }

            for (var i = 0; i < prevsource.length; i++) {
                if (target == prevsource[i]) {
                    if (!op.instr.includes("CMP")) {
                        warcount++;
                        console.log("warcount h2" + warcount + op.instr + prevop.instr + target + prevsource[i]);
                        break;
                    }
                }
            }
            if (prevop.instr == 'CBNZ') {
                console.log(prevop.source + prevop.target + "sleep")
                branchitems.push(randomcount);
            }
            if (prevop.instr == 'CBZ') {
                console.log(prevop.source + prevop.target + "sleep")
                branchitems.push(randomcount);
            }
            if ((op.instr.charAt(0) == 'B' || op.instr == 'CBNZ' || op.instr == 'CBZ') && randomcount > op.addr) {
                console.log(op.instr.condCode)
                rawitems.push(randomcount);
                console.log("rawcount h1 " + randomcount + " going "+ rawcount + "part2");
                branchnum = op.addr;
                targetlabel = op.target;
                stallcount = stallcount + 2;
                if (op.condCode == undefined) {
                    stallcount = stallcount - 2;
                }
                textnoOfStalls.textContent = stallcount;
                branchop = op.instr + op.condCode;
            }

            prevop = op;
            prevtarget = target;
            prevsource = sources;
            pipecycles = 4 + totalnum + stallcount;
            textnoOfCycles.textContent = "Number of cycles: " + (pipecycles);
            randomcount++;
            return execF(vm, this)
        }
    }
}