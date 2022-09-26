"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = require("os");
const child_process_1 = require("child_process");
const path_1 = require("path");
const fs_1 = require("fs");
class ParallelExecutor {
    cpus = (0, os_1.cpus)();
    dataBatches;
    childProcessWrapperPath = (0, path_1.join)(__dirname, "child.js");
    childProcessesFilePath = (0, path_1.join)(__dirname, "child_process.js");
    forkedProcesses;
    forkedProcessesResults = {};
    async execute(callback, options) {
        options.data ||= [];
        options.params ||= {};
        return new Promise(async (resolve) => {
            this.dataBatches = this.splitDataIntoBatches(options.data);
            this.createFileForChildProcesses(callback);
            this.forkedProcesses = this.forkProcesses(options);
            await this.executeForkedProcessesTroughIPCChannel(options);
            resolve(this.generateRefinedResults(options));
            this.onExit();
        });
    }
    splitDataIntoBatches(data) {
        return data.reduce((dataBatches, dataItem, i) => {
            dataBatches[i % this.cpus.length].push(dataItem);
            return dataBatches;
        }, new Array(this.cpus.length).fill(0).map(() => []));
    }
    createFileForChildProcesses(callback) {
        let childProcessWrapper = (0, fs_1.readFileSync)(this.childProcessWrapperPath).toString();
        const fileContent = `
      const callback = ${callback.toString()}
    `;
        childProcessWrapper = childProcessWrapper.replace("/* #callback# */", fileContent);
        (0, fs_1.writeFileSync)(this.childProcessesFilePath, childProcessWrapper);
    }
    forkProcesses(options) {
        return this.cpus.reduce((forkedProcesses) => {
            forkedProcesses.push(this.forkProcess(options.childProcess?.maxOldSpaceSize));
            return forkedProcesses;
        }, []);
    }
    forkProcess(maxOldSpaceSize) {
        const options = {};
        if (typeof maxOldSpaceSize === "number")
            options.execArgv = [`--max-old-space-size=${maxOldSpaceSize}`];
        return (0, child_process_1.fork)(this.childProcessesFilePath, options);
    }
    executeForkedProcessesTroughIPCChannel(options) {
        return new Promise((resolve) => this.forkedProcesses.forEach((forkedProcess, i) => {
            const pid = forkedProcess.pid;
            forkedProcess.on("message", (result) => {
                this.forkedProcessesResults[pid] = result;
                if (Object.keys(this.forkedProcessesResults).length === this.cpus.length)
                    resolve();
            });
            forkedProcess.send({
                data: this.dataBatches[i],
                params: { ...options.params, pid: pid },
            });
        }));
    }
    generateRefinedResults(options) {
        let j = 0;
        return options.data.reduce((results, value, i) => {
            const pid = this.forkedProcesses[i % this.cpus.length].pid;
            if (i !== 0 && i % this.cpus.length === 0)
                ++j;
            results.push(this.forkedProcessesResults[pid][j]);
            return results;
        }, []);
    }
    onExit() {
        this.dataBatches = [];
        this.forkedProcesses.forEach((forkedProcess) => forkedProcess.kill());
        this.forkedProcessesResults = {};
    }
}
module.exports = { ParallelExecutor };
