import { cpus } from 'os';
import { fork } from 'child_process';
import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

class ParallelExecutor {
    cpus = cpus();
    dataBatches;
    childProcessWrapperPath = join(__dirname, typeof require === 'undefined' ? 'child.esm.js' : 'child.cjs.js');
    childProcessesFilePath = join(__dirname, 'child_process.js');
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
        let childProcessWrapper = readFileSync(this.childProcessWrapperPath).toString();
        const fileContent = `
      const callback = ${callback.toString()}
    `;
        childProcessWrapper = childProcessWrapper.replace('/* #callback# */', fileContent);
        writeFileSync(this.childProcessesFilePath, childProcessWrapper);
    }
    forkProcesses(options) {
        return this.cpus.reduce((forkedProcesses) => {
            forkedProcesses.push(this.forkProcess(options.childProcess?.maxOldSpaceSize));
            return forkedProcesses;
        }, []);
    }
    forkProcess(maxOldSpaceSize) {
        const options = {};
        if (typeof maxOldSpaceSize === 'number')
            options.execArgv = [`--max-old-space-size=${maxOldSpaceSize}`];
        return fork(this.childProcessesFilePath, options);
    }
    executeForkedProcessesTroughIPCChannel(options) {
        return new Promise((resolve) => this.forkedProcesses.forEach((forkedProcess, i) => {
            const pid = forkedProcess.pid;
            forkedProcess.on('message', (result) => {
                this.forkedProcessesResults[pid] = result;
                if (Object.keys(this.forkedProcessesResults).length === this.cpus.length)
                    resolve();
            });
            forkedProcess.send({
                data: this.dataBatches[i],
                params: { ...options.params, pid: pid }
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

export { ParallelExecutor };
