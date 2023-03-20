/*
The MIT License (MIT)
Copyright (c) 2013 Oskar Ojala
See LICENSE for details
*/

"use strict";

var arrayOfSize = function (size) {
    var a = new Array(size)
    for (var i = 0; i < a.length; ++i)
        a[i] = 0;
    return a
}

var vmConfiguration = {
    memSizeWords: 256,
    physMemOffset: 0x20000000,
    dataOffset: 0x0
}
var totalnum = 0;

function createVm(vmconf) {
    return {
        regFile: {
            R0: 0,
            R1: 0,
            R2: 0,
            R3: 0,
            R4: 0,
            R5: 0,
            R6: 0,
            R7: 0,
            R8: 0,
            R9: 0,
            R10: 0,
            R11: 0,
            R12: 0,
            R13: 0,
            R14: 0,
            R15: 0,
            cpsr: 0
        },

        memory: arrayOfSize(vmconf.memSizeWords),

        reset: function () {
            var name;
            for (name in this.regFile) {
                if (typeof (this.regFile[name]) !== 'function') {
                    this.regFile[name] = 0
                }
            }
            for (var i = 0; i < this.memory.length; ++i)
                this.memory[i] = 0;
        },

        condTruthy: function (condCode) {
            switch (condCode) {
                case 'AL': return true
                case 'EQ': return this.getCpsrZ() === 1
                case 'NE': return this.getCpsrZ() === 0
                case 'CS':
                case 'HS': return this.getCpsrC() === 1
                case 'CC':
                case 'LO': return this.getCpsrC() === 0
                case 'MI': return this.getCpsrN() === 1
                case 'PL': return this.getCpsrN() === 0
                case 'VS': return this.getCpsrV() === 1
                case 'VC': return this.getCpsrV() === 0

                case 'HI': return this.getCpsrC() === 1 && this.getCpsrZ() === 0
                case 'LS': return this.getCpsrC() === 0 || this.getCpsrZ() === 1

                case 'GE': return this.getCpsrN() === this.getCpsrV()
                case 'LT': return this.getCpsrN() !== this.getCpsrV()
                case 'GT': return this.getCpsrZ() === 0 && this.getCpsrN() === this.getCpsrV()
                case 'LE': return this.getCpsrZ() === 1 || this.getCpsrN() !== this.getCpsrV()
            }
        },

        executeOps: function (program) {
            var ops = program.ops, labels = program.labels
            var i = 0, bt = undefined
            var total = 1;
            var prevopinstr = '';
            var str = document.getElementById("program").value;
            var lines = str.split("\n");
            str = str.replace(/\n+$/, "");

            while (i < ops.length) {
                if (lines[i] !== undefined) {
                    lines[i] = lines[i] + ' - ' + '[I' + (total-1) + ']';
                    document.getElementById("program").value = lines.join("\n");
                }
                
                totalnum = total;
                if (ops[i].condCode === undefined || this.condTruthy(ops[i].condCode)) {
                    bt = ops[i].exec(this)
                }
                if (prevopinstr == "B") {
                    branchitems.push(total - 1);
                }
                if (ops[i].instr == "B" && ops[i].condCode != undefined) {
                    rawitems.push(total - 1);
                }
                prevopinstr = ops[i].instr;
                if (bt !== undefined) {
                    i = labels[bt]
                    bt = undefined
                    total++;
                } else {
                    total++;
                    if (ops[i].instr == "B" && ops[i].condCode != undefined) {
                        rawitems.push(randomcount);
                        branchitems.push(randomcount + 1);
                        chcount++;
                        count++;
                        rawcount++;
                        stallcount = stallcount + 3;
                    }
                    i++
                }
            }
        },

        executeSingle: function (program) {
            var ops = program.ops, labels = program.labels
            var i = 0, bt = undefined
            var that = this
            var total = 1, prevcountstalls = 0, prevcount = 0, loopcount = 0;
            var prevopinstr = ''; const prevprevregtarget = [], prevprevregtargetsouce = [];
            document.getElementById("runButton").disabled = true;
            return function () {
                var str = document.getElementById("program").value;
                var lines = str.split("\n");
                str = str.replace(/\n+$/, "");
                var textnoOfIterations = document.getElementById("noOfIterations");
                var textnoOfStallsCount = document.getElementById("noOfStallsCount");
                var textnoOfCycles = document.getElementById("noOfCycles");
                var textnoOfStalls = document.getElementById("noOfStalls");
                var checkBox = document.getElementById("pipelineCheckBox");
                var instrcountnum = document.getElementById('noOfInstrCount');
                var textsteadyStateCPI = document.getElementById("steadyStateCPI");
                var selectcontrolhazard = document.querySelector('#selectcontrolhazard');
                var outputbranch = selectcontrolhazard.value;
                var selectdatahazard = document.querySelector('#selectdatahazard');
                var outputdata = selectdatahazard.value;
                var uniquebranch = branchitems.filter(onlyUnique);
                var data = 0;
                var branch = 0;
                filtered = prevstallitems.filter(item => !uniquebranch.includes(item));
                console.log(prevstallitems.length);
                
                if (outputdata == "dataForwarding") {
                    data = 0;
                }
                else if (outputdata == "decodeWB") {
                    data = rawcount * 2;
                }
                else if (outputdata == "noCounterMeasure") {
                    data = rawcount * 3;
                }

                if (outputbranch == "decodeID") {
                    branch = chcount;
                }
                else if (outputbranch == "executeEX") {
                    branch = chcount * 2;
                }
                else if (outputbranch == "memoryME") {
                    branch = chcount * 3;
                }

                if (checkBox.checked == true) {
                    textnoOfStalls.style.display = "block";
                }
                else {
                    textnoOfStalls.style.display = "none";
                }

                if (document.getElementById("program").value == '') {
                    document.getElementById("program").value = '';
                    document.getElementById('log').textContent = "EXCEPTION: Please input instructions";
                }
                else {
                    if (lines[i] !== undefined) {
                        lines[i] = lines[i] + ' - ' + '[I' + (total-1) + ']';
                        document.getElementById("program").value = lines.join("\n");
                        totalnum = total;
                        instrcountnum.textContent = total;
                        textnoOfStallsCount.textContent = data + prevcountstalls + branch;
                        stallcountcal = (totalnum + data + prevcountstalls + branch + 4);
                    }
                 
                    if (i >= ops.length)
                        return
                    if (ops[i].condCode === undefined || that.condTruthy(ops[i].condCode)) {
                        bt = ops[i].exec(that)
                    }
                    prevprevregtarget.push(ops[i].target);
                    prevprevregtargetsouce.push(ops[i].instr);
                    prevcount++;
                    if (prevcount >= 3) {
                        for (var k = 0; k < prevprevregtarget.length; k++) {
                            if (prevcount - k == 3) {
                                if (prevprevregtarget[k] == ops[i].target && ops[i].instr != 'CMP' && prevopinstr != "B" && prevopinstr != "CBNZ" && prevopinstr != "CBZ" && prevprevregtargetsouce[k] != 'STUR' && ops[i].instr != 'LDUR' && ops[i].instr != 'CBNZ' && ops[i].instr != 'CBZ') {
                                    prevcountstalls++;
                                }
                            }
                        }
                    }
                    if (prevopinstr == 'CBNZ') {
                        chcount++;
                        if (outputbranch == "decodeID") {
                            branch = chcount;
                        }
                        else if (outputbranch == "executeEX") {
                            branch = chcount * 2;
                        }
                        else if (outputbranch == "memoryME") {
                            branch = chcount * 3;
                        }
                        textnoOfStallsCount.textContent = data + prevcountstalls + branch;
                        stallcountcal = (totalnum + data + prevcountstalls + branch + 4);
                    }
                    if (prevopinstr == 'CBZ') {
                        chcount++;
                        if (outputbranch == "decodeID") {
                            branch = chcount;
                        }
                        else if (outputbranch == "executeEX") {
                            branch = chcount * 2;
                        }
                        else if (outputbranch == "memoryME") {
                            branch = chcount * 3;
                        }
                        textnoOfStallsCount.textContent = data + prevcountstalls + branch;
                        stallcountcal = (totalnum + data + prevcountstalls + branch + 4);
                    }
                    if (prevopinstr == "B") {
                        chcount++;
                        if (outputbranch == "decodeID") {
                            branch = chcount;
                        }
                        else if (outputbranch == "executeEX") {
                            branch = chcount * 2;
                        }
                        else if (outputbranch == "memoryME") {
                            branch = chcount * 3;
                        }
                        textnoOfStallsCount.textContent = data + prevcountstalls + branch;
                        stallcountcal = (totalnum + data + prevcountstalls + branch + 4);
                        if (checkBox.checked == true) {
                            if (stallcountcal > 0) {
                                textnoOfCycles.textContent = "No. of cycles: " + stallcountcal;
                                textsteadyStateCPI.textContent = "Steady State CPI: " + ((totalnum + data + prevcountstalls + branch) / totalnum);
                            }
                        }
                        else {
                            textnoOfCycles.textContent = "No. of cycles: " + totalnum;
                        }
                    }
                    if (ops[i].instr == "B" && ops[i].condCode != undefined) {
                        rawcount++;
                        loopcount++
                        if (outputdata == "dataForwarding") {
                            data = 0;
                        }
                        else if (outputdata == "decodeWB") {
                            data = rawcount * 2;
                        }
                        else if (outputdata == "noCounterMeasure") {
                            data = rawcount * 3;
                        }
                        stallcountcal = (totalnum + data + prevcountstalls + branch + 4);
            
                        if (checkBox.checked == true) {
                            if (stallcountcal > 0) {
                                textnoOfCycles.textContent = "No. of cycles: " + stallcountcal;
                                textsteadyStateCPI.textContent = "Steady State CPI: " + ((totalnum + data + prevcountstalls + branch) / totalnum);
                            }
                        }
                        else {
                            textnoOfCycles.textContent = "No. of cycles: " + totalnum;
                        }
                    }
                    if (ops[i].instr == "CMP") {
                        textnoOfStallsCount.textContent = data + prevcountstalls + branch;
                        if (checkBox.checked == true) {
                            if (stallcountcal > 0) {
                                textnoOfCycles.textContent = "No. of cycles: " + stallcountcal;
                                textsteadyStateCPI.textContent = "Steady State CPI: " + ((totalnum + data + prevcountstalls + branch) / totalnum);
                            }
                        }
                        else {
                            textnoOfCycles.textContent = "No. of cycles: " + totalnum;
                        }
                    }
                    if (ops[i].instr == "STUR") {
                       textnoOfStallsCount.textContent = data + prevcountstalls + branch;
                        stallcountcal = (totalnum + data + prevcountstalls + branch + 4);
                        if (checkBox.checked == true) {
                            if (stallcountcal > 0) {
                                textnoOfCycles.textContent = "No. of cycles: " + stallcountcal;
                                textsteadyStateCPI.textContent = "Steady State CPI: " + ((totalnum + data + prevcountstalls + branch) / totalnum);
                            }
                        }
                        else {
                            textnoOfCycles.textContent = "No. of cycles: " + totalnum;
                        }
                    }
                    prevopinstr = ops[i].instr;
                    if (bt !== undefined) {
                        i = labels[bt]
                        bt = undefined
                        textnoOfStallsCount.textContent = data + prevcountstalls + branch;
                        if (checkBox.checked == true) {
                            if (stallcountcal > 0) {
                                textnoOfCycles.textContent = "No. of cycles: " + stallcountcal;
                                textsteadyStateCPI.textContent = "Steady State CPI: " + ((totalnum + data + prevcountstalls + branch) / totalnum);
                            }
                        }
                        else {
                            textnoOfCycles.textContent = "No. of cycles: " + totalnum;
                        }
                        total++;
                    } else {
                        total++;
                        textnoOfStallsCount.textContent = data + prevcountstalls + branch;
                        stallcountcal = (totalnum + data + prevcountstalls + branch + 4);
                        textnoOfIterations.textContent = "No. of Iterations: " + (loopcount);
                        if (checkBox.checked == true) {
                            if (stallcountcal > 0) {
                                textnoOfCycles.textContent = "No. of cycles: " + stallcountcal;
                                textsteadyStateCPI.textContent = "Steady State CPI: " + ((totalnum + data + prevcountstalls + branch) / totalnum);
                                textnoOfStallsCount.textContent = data + prevcountstalls + branch;
                            }
                        }
                        else {
                            textnoOfCycles.textContent = "No. of cycles: " + totalnum;
                        }
                        i++
                    }
                }
            }
        },

        validMemAddress: function (addr) {
            if (addr & 0x3)
                throw {
                    name: 'AddressingException',
                    message: 'Address ' + addr + ' is not word aligned!'
                }
            var offsetWords = (addr - vmconf.physMemOffset) >> 2
            if (offsetWords < 0 || offsetWords > vmconf.memSizeWords)
                throw {
                    name: 'AddressingException',
                    message: 'Address ' + addr + ' is outside mapped memory!'
                }
            return offsetWords
        },
        readMem32: function (addr) {
            console.log(addr)
            var offsetWords = this.validMemAddress(addr)
            return this.memory[offsetWords]
        },
        writeMem32: function (addr, word) {
            var offsetWords = this.validMemAddress(addr)
            this.memory[offsetWords] = word
        },
        getMemCopy: function () {
            return this.memory.slice(0)
        },

        readReg: function (reg) {
            return this.regFile[reg]
        },
        // Negative, Zero, Carry, oVerflow
        getCpsrN: function () {
            return (this.regFile.cpsr >> 31) & 1;
        },
        getCpsrZ: function () {
            return (this.regFile.cpsr >> 30) & 1;
        },
        getCpsrC: function () {
            return (this.regFile.cpsr >> 29) & 1;
        },
        getCpsrV: function () {
            return (this.regFile.cpsr >> 28) & 1;
        },

        updateApsr: function (val, opType) {
            // clear condition codes
            this.regFile.cpsr &= 0x0fffffff
            // N=negative
            this.regFile.cpsr |= val < 0 ? 0x80000000 : 0
            // Z=zero
            this.regFile.cpsr |= val === 0 ? 0x40000000 : 0
            // C=carry
            switch (opType) {
                case 'ADD':
                    this.regFile.cpsr |= val > 0xffffffff ? 0x20000000 : 0
                    break
                case 'SUB':
                    this.regFile.cpsr |= val >= 0 ? 0x20000000 : 0
                    break
                case 'SHIFT':
                    // TODO
                    break
                default:
                    // do nothing
                    break
            }
            // V=overflow
            switch (opType) {
                case 'ADD':
                case 'SUB':
                    this.regFile.cpsr |= val > 0x7fffffff || val < -2147483648 ? 0x10000000 : 0
                    break
                default:
                    // do nothing
                    break
            }
            // This makes JS interpret the value as unsigned for display purposes
            this.regFile.cpsr >>>= 0
        },

        updateReg: function (reg, value, updateCond) {
            reg = reg.toUpperCase()
            if (reg === 'PC')
                reg = 'R15'
            if (this.regFile.hasOwnProperty(reg)) {
                this.regFile[reg] = value & 0xffffffff
                if (updateCond)
                    this.updateApsr(value, updateCond)
                updateRegDisplay(reg, value)
            } else {
                throw {
                    name: 'StateModificationException',
                    message: 'Register ' + reg + ' does not exist!'
                }
            }
        }
    }
}

var updateRegDisplay = function (reg, value) {
    var regLc = reg.toLowerCase()
    document.getElementById(regLc + 'row').className = 'highlight'
    document.getElementById(regLc + 'val').textContent = value
}

var displayRegs = function (vm) {
    function displayR(reg, value) {
        document.getElementById(reg + 'val').textContent = value
    }
    for (var i = 0; i < 16; ++i) {
        displayR('r' + i, vm.readReg('R' + i))
    }
    displayR('cpsr', '0x' + vm.readReg('cpsr').toString(16))
}

var clearRegHighlights = function () {
    for (var i = 0; i < 16; ++i) {
        document.getElementById('r' + i + 'row').className = ''
    }
    document.getElementById('cpsrrow').className = ''
}

var drawMemtable = function () {
    var start = 0x20000000
    var end = start + 1024
    var wordsPerRow = 8
    var memView = document.getElementById('memtable')
    for (var i = start; i < end; i += wordsPerRow << 2) {
        var tr = document.createElement('tr')
        memView.appendChild(tr)
        var td = document.createElement('td')
        tr.appendChild(td)
        td.appendChild(document.createTextNode(i.toString(16)))
        for (var j = i; j < i + (wordsPerRow << 2); j += 4) {
            var td = document.createElement('td')
            tr.appendChild(td)
            td.appendChild(document.createTextNode('0'))
        }
    }
}

var updateMemtable = function (memValues) {
    var memView = document.getElementById('memtable')
    for (var i = 1; i < memView.children.length; i++) {
        var tr = memView.children[i]
        var wordsPerRow = tr.children.length - 1
        for (var j = 1; j < tr.children.length; j++) {
            tr.children[j].childNodes[0].data = memValues[(i - 1) * wordsPerRow + (j - 1)]
        }
    }
}

function resetVmAndGUI(vm) {
    vm.reset()
    displayRegs(vm)
    clearRegHighlights()
    updateMemtable(vm.getMemCopy())
    clearLogs()
    window.vmIsReset = true
}

function printinfo() {
    var checkBox = document.getElementById("pipelineCheckBox");
    var textsteadyStateCPI = document.getElementById("steadyStateCPI");
    var textnoOfCycles = document.getElementById("noOfCycles");
    var textnoOfIterations = document.getElementById("noOfIterations");
    var textnoOfStallsCount = document.getElementById("noOfStallsCount");
    var instrcountnum = document.getElementById('noOfInstrCount');
    instrcountnum.textContent = totalnum;

    if (checkBox.checked == true) {
        cpi = (totalnum + stallcount) / totalnum;
        textsteadyStateCPI.style.display = "block";
        textnoOfCycles.style.display = "block";
        textnoOfIterations.style.display = "block";
        textnoOfIterations.textContent = "No. of Iterations: " + (count);
        textsteadyStateCPI.textContent = "Steady State CPI: " + cpi;
    
        if ((count - 2) > 0) {
            instrcountnum.textContent = totalnum;
            textnoOfStallsCount.textContent = stallcount + prevcountstalls + 2;
            afteriterations = 4 + totalnum + stallcount + 1;
            textnoOfIterations.textContent = "No. of Iterations: " + count;
            textnoOfCycles.textContent = "No. of cycles: " + (afteriterations);
            textsteadyStateCPI.textContent = "Steady State CPI: " + ((totalnum + (stallcount + 1)) / totalnum);
        }

    } else {
        totalcycles = totalnum;
        cpi = (totalcycles / totalnum);
        textnoOfCycles.textContent = "No. of cycles: " + (totalnum * cpi);
        textsteadyStateCPI.style.display = "block";
        textnoOfCycles.style.display = "block";
        textnoOfIterations.style.display = "none";
        textnoOfIterations.textContent = "No. of Iterations: " + (count);
        textsteadyStateCPI.textContent = "Steady State CPI: " + cpi;

        if ((count - 2) > 0) {
            instrcountnum.textContent = totalnum;
            totalcycles = totalnum;
            cpi = (totalcycles / totalnum);
            textnoOfCycles.textContent = "No. of cycles: " + (totalnum * cpi);
            textnoOfIterations.textContent = "No. of Iterations: " + count;
            textsteadyStateCPI.textContent = "Steady State CPI: " + ((totalnum + (stallcount + 1)) / totalnum);
        }
    }
}
var filtered = [];
var stallcountcal = 0;
function runProgram(vm) {
    return function () {     
        resetVmAndGUI(vm)
        try {
            var program = readProgram(vm, document.getElementById('program').value)
            vm.executeOps(program)
            printinfo();
        } catch (e) {
            updateLog('EXCEPTION: ' + e.name + '\nReason: ' + e.message + '\n')
        }
        displayRegs(vm);

        document.getElementById("clockCycles").style.display = "block";

        updateMemtable(vm.getMemCopy())
        window.vmIsReset = true
        document.getElementById("runButton").disabled = true;
        document.getElementById("stepButton").disabled = true;

        var checkBox = document.getElementById("pipelineCheckBox");
        var textnoOfStalls = document.getElementById("noOfStalls");
        var textnoOfStallsCount = document.getElementById("noOfStallsCount");
        var parent = document.getElementById('clockCycles');
        var newChild = '';
        var leftcount = 19;
        var topcount = 1;      

        if (checkBox.checked == true) {
            if ((count - 1) > 0) {
                var newrandomcount = randomcount - 1;
                pipecycles = afteriterations; 
                rawitems.push(newrandomcount);
            }
            var unique = rawitems.filter(onlyUnique);
            var uniquebranch = branchitems.filter(onlyUnique);
            var textnoOfCycles = document.getElementById("noOfCycles");
            var textsteadyStateCPI = document.getElementById("steadyStateCPI");
            filtered = prevstallitems.filter(item => !uniquebranch.includes(item));
            var selectcontrolhazard = document.querySelector('#selectcontrolhazard');
            var outputbranch = selectcontrolhazard.value;
            var selectdatahazard = document.querySelector('#selectdatahazard');
            var outputdata = selectdatahazard.value;
            var branch = 0;
            var data = 0;   
            

            if (outputdata == "dataForwarding") {
                data = 0;
            }
            else if (outputdata == "decodeWB") {
                data = unique.length * 2;
            }
            else if (outputdata == "noCounterMeasure") {
                data = unique.length * 3;
            }

            if (outputbranch == "decodeID") {
                branch = uniquebranch.length;
            }
            else if (outputbranch == "executeEX") {
                branch = uniquebranch.length * 2;
            }
            else if (outputbranch == "memoryME") {
                branch = uniquebranch.length * 3;
            }

        
            stallcountcal = (totalnum + data + filtered.length + branch + 4);
            textnoOfStallsCount.textContent = data + filtered.length + branch;
            textnoOfCycles.textContent = "No. of cycles: " + stallcountcal;
            textsteadyStateCPI.textContent = "Steady State CPI: " + ((stallcountcal - 4) / totalnum);
          
            for (var i = 1; i <= stallcountcal; i++) {
                document.getElementById("displayClockCycle").innerHTML += i + "&nbsp;" + "&nbsp;" + "&nbsp;" + "&nbsp;" + "&nbsp;" + "&nbsp;" + "&nbsp;" + "&nbsp;";
            }
            for (var i = 0; i < uniquebranch.length; i++) {
                console.log(uniquebranch[i] + "branchafter");
            }
            for (var i = 0; i < rawitems.length; i++) {
                console.log(rawitems[i] + "raw");
            }
            for (var i = 0; i < filtered.length; i++) {
                console.log(filtered[i] + "previous stalls");
            }

            document.getElementById("displayInstrOrder").innerHTML = '';
            for (var i = 0; i < totalnum; i++) {
                document.getElementById("displayInstrOrder").innerHTML += String ("I" + i) + "<br>";
            }

            var temp = 0;
            parent.insertAdjacentHTML('beforeend', newChild);
            newChild =
                '<br/>' +
                '<div class="fetch" style="margin-left: ' + leftcount + 'px; top: ' + topcount + 'px;">IF ' + '</div>' +
                '<div class="decode" style = "top: ' + topcount + 'px;">ID ' + '</div>' +
                '<div class="execute" style = "top: ' + topcount + 'px;">EX ' + '</div>' +
                '<div class="memoryfetch" style = "top: ' + topcount + 'px;">ME ' + '</div>' +
                '<div class="writeback" style = "top: ' + topcount + 'px;">WB ' + '</div>';
            leftcount = leftcount + 45;
            topcount = topcount + 1;

                for (var i = 1; i < totalnum + 1; i++) {
                    for (var k = 0; k < unique.length; k++) {
                        if (unique[k] == i) {
                             if (outputdata == "dataForwarding") {
                                parent.insertAdjacentHTML('beforeend', newChild);
                                newChild =
                                    '<br/>' +
                                    '<div class="fetch" style="margin-left: ' + leftcount + 'px; top: ' + topcount + 'px;">IF ' + '</div>' +
                                    '<div class="decode" style = "top: ' + topcount + 'px;">ID ' + '</div>' +
                                    '<div class="execute" style = "top: ' + topcount + 'px;">EX ' + '</div>' +
                                    '<div class="memoryfetch" style = "top: ' + topcount + 'px;">ME ' + '</div>' +
                                    '<div class="writeback" style = "top: ' + topcount + 'px;">WB ' + '</div>';
                                leftcount = leftcount + 45;
                                topcount = topcount + 1;
                                temp = i;
                            }
                            else if (outputdata == "decodeWB") {
                                parent.insertAdjacentHTML('beforeend', newChild);
                                newChild =
                                    '<br/>' +
                                    '<div class="stall"style="margin-left: ' + leftcount + 'px; top: ' + topcount + 'px;">S ' + '</div>' +
                                    '<div class="stall" style = "top: ' + topcount + 'px;">S ' + '</div>' +
                                    '<div class="fetch" style="top: ' + topcount + 'px;">IF ' + '</div>' +
                                    '<div class="decode" style = "top: ' + topcount + 'px;">ID ' + '</div>' +
                                    '<div class="execute" style = "top: ' + topcount + 'px;">EX ' + '</div>' +
                                    '<div class="memoryfetch" style = "top: ' + topcount + 'px;">ME ' + '</div>' +
                                    '<div class="writeback" style = "top: ' + topcount + 'px;">WB ' + '</div>';
                                leftcount = leftcount + 135;
                                topcount = topcount + 1;
                                temp = i;
                            }
                            else if (outputdata == "noCounterMeasure") {
                                parent.insertAdjacentHTML('beforeend', newChild);
                                newChild =
                                    '<br/>' +
                                    '<div class="stall"style="margin-left: ' + leftcount + 'px; top: ' + topcount + 'px;">S ' + '</div>' +
                                    '<div class="stall" style = "top: ' + topcount + 'px;">S ' + '</div>' +
                                    '<div class="stall" style = "top: ' + topcount + 'px;">S ' + '</div>' +
                                    '<div class="fetch" style="top: ' + topcount + 'px;">IF ' + '</div>' +
                                    '<div class="decode" style = "top: ' + topcount + 'px;">ID ' + '</div>' +
                                    '<div class="execute" style = "top: ' + topcount + 'px;">EX ' + '</div>' +
                                    '<div class="memoryfetch" style = "top: ' + topcount + 'px;">ME ' + '</div>' +
                                    '<div class="writeback" style = "top: ' + topcount + 'px;">WB ' + '</div>';
                                leftcount = leftcount + 180;
                                topcount = topcount + 1;
                                temp = i;
                            }
                        }
                    }
                    for (var k = 0; k < uniquebranch.length; k++) {
                        if (uniquebranch[k] == i) {
                            if (outputbranch == "decodeID") {
                                parent.insertAdjacentHTML('beforeend', newChild);
                                newChild =
                                    '<br/>' +
                                    '<div class="stall" style="margin-left: ' + leftcount + 'px; top: ' + topcount + 'px;">S ' + '</div>' +
                                    '<div class="fetch" style="top: ' + topcount + 'px;">IF ' + '</div>' +
                                    '<div class="decode" style = "top: ' + topcount + 'px;">ID ' + '</div>' +
                                    '<div class="execute" style = "top: ' + topcount + 'px;">EX ' + '</div>' +
                                    '<div class="memoryfetch" style = "top: ' + topcount + 'px;">ME ' + '</div>' +
                                    '<div class="writeback" style = "top: ' + topcount + 'px;">WB ' + '</div>';
                                leftcount = leftcount + 90;
                                topcount = topcount + 1;
                                temp = i;
                            }
                            else if (outputbranch == "executeEX") {
                                parent.insertAdjacentHTML('beforeend', newChild);
                                newChild =
                                    '<br/>' +
                                    '<div class="stall"style="margin-left: ' + leftcount + 'px; top: ' + topcount + 'px;">S ' + '</div>' +
                                    '<div class="stall" style = "top: ' + topcount + 'px;">S ' + '</div>' +
                                    '<div class="fetch" style="top: ' + topcount + 'px;">IF ' + '</div>' +
                                    '<div class="decode" style = "top: ' + topcount + 'px;">ID ' + '</div>' +
                                    '<div class="execute" style = "top: ' + topcount + 'px;">EX ' + '</div>' +
                                    '<div class="memoryfetch" style = "top: ' + topcount + 'px;">ME ' + '</div>' +
                                    '<div class="writeback" style = "top: ' + topcount + 'px;">WB ' + '</div>';
                                leftcount = leftcount + 135;
                                topcount = topcount + 1;
                                temp = i;
                            }
                            else if (outputbranch == "memoryME") {
                                parent.insertAdjacentHTML('beforeend', newChild);
                                newChild =
                                    '<br/>' +
                                    '<div class="stall"style="margin-left: ' + leftcount + 'px; top: ' + topcount + 'px;">S ' + '</div>' +
                                    '<div class="stall" style = "top: ' + topcount + 'px;">S ' + '</div>' +
                                    '<div class="stall" style = "top: ' + topcount + 'px;">S ' + '</div>' +
                                    '<div class="fetch" style="top: ' + topcount + 'px;">IF ' + '</div>' +
                                    '<div class="decode" style = "top: ' + topcount + 'px;">ID ' + '</div>' +
                                    '<div class="execute" style = "top: ' + topcount + 'px;">EX ' + '</div>' +
                                    '<div class="memoryfetch" style = "top: ' + topcount + 'px;">ME ' + '</div>' +
                                    '<div class="writeback" style = "top: ' + topcount + 'px;">WB ' + '</div>';
                                leftcount = leftcount + 180;
                                topcount = topcount + 1;
                                temp = i;
                            }
                        }
                    }
                    for (var k = 0; k < filtered.length; k++) {
                        if (filtered[k] == i) {
                            parent.insertAdjacentHTML('beforeend', newChild); 
                            newChild =
                                '<br/>' +
                                '<div class="stall" style="margin-left: ' + leftcount + 'px; top: ' + topcount + 'px;">S ' + '</div>' +
                                '<div class="fetch" style="top: ' + topcount + 'px;">IF ' + '</div>' +
                                '<div class="decode" style = "top: ' + topcount + 'px;">ID ' + '</div>' +
                                '<div class="execute" style = "top: ' + topcount + 'px;">EX ' + '</div>' +
                                '<div class="memoryfetch" style = "top: ' + topcount + 'px;">ME ' + '</div>' +
                            '<div class="writeback" style = "top: ' + topcount + 'px;">WB ' + '</div>';
                            leftcount = leftcount + 90;
                            topcount = topcount + 1;
                            temp = i;
                        }
                    }
                    if (temp != i) {
                        parent.insertAdjacentHTML('beforeend', newChild);
                        newChild =
                            '<br/>' +
                            '<div class="fetch" style="margin-left: ' + leftcount + 'px; top: ' + topcount + 'px;">IF ' + '</div>' +
                            '<div class="decode" style = "top: ' + topcount + 'px;">ID ' + '</div>' +
                            '<div class="execute" style = "top: ' + topcount + 'px;">EX ' + '</div>' +
                            '<div class="memoryfetch" style = "top: ' + topcount + 'px;">ME ' + '</div>' +
                        '<div class="writeback" style = "top: ' + topcount + 'px;">WB ' + '</div>';
                        leftcount = leftcount + 45;
                        topcount = topcount + 1;
                    }
                }
         
                textnoOfStalls.style.display = "block";
        } else {
            textnoOfStalls.style.display = "none";
        }
    }
}

function resetState(vm) {
    return function () {
        resetVmAndGUI(vm)
        location.reload();
    }
}

function stepProgram(vm) {
    var stepF
    return function () {
        if (vmIsReset) {
            resetVmAndGUI(vm)
            var program = readProgram(vm, document.getElementById('program').value)
            stepF = vm.executeSingle(program)
            stepF()
            updateMemtable(vm.getMemCopy())
            window.vmIsReset = false
        } else {
            stepF()
            updateMemtable(vm.getMemCopy())
        }
    }
}
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}
function updateLog(msg) {
    document.getElementById('log').textContent += msg
}

function clearLogs() {
    document.getElementById('log').textContent = ''
}

function domLoaded() {
    document.removeEventListener("DOMContentLoaded", domLoaded, false)
    var vm = createVm(vmConfiguration)
    displayRegs(vm)
    drawMemtable()
    document.getElementById('runButton').onclick = runProgram(vm)
    document.getElementById('resetButton').onclick = resetState(vm)
    document.getElementById('stepButton').onclick = stepProgram(vm)
    window.vmIsReset = true
}

document.addEventListener("DOMContentLoaded", domLoaded, false)