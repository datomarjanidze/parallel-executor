import { CpuInfo, cpus } from "os";
import { ChildProcess, fork, ForkOptions } from "child_process";
import { join } from "path";
import { writeFileSync, readFileSync } from "fs";

import { Callback, IOptions, Data, DataBatches, IParams } from "./types";

class ParallelExecutor {
  cpus: CpuInfo[] = cpus();
  dataBatches!: DataBatches;
  childProcessWrapper = join(__dirname, "child.js");
  childProcessesFilePath = join(__dirname, "child_process.js");
  forkedProcesses!: ChildProcess[];
  forkedProcessesResults: { [key: string]: any } = {};

  async execute(callback: Callback, options: IOptions): Promise<any> {
    return new Promise(async (resolve) => {
      this.dataBatches = this.splitDataIntoBatches(options.data);
      this.createFileForChildProcesses(callback);
      this.forkedProcesses = this.forkProcesses(options);
      await this.executeForkedProcessesTroughIPCChannel(options);
      resolve(this.generateRefinedResults(options));
    });
  }

  private splitDataIntoBatches(data: Data): DataBatches {
    return data.reduce(
      (dataBatches: DataBatches, dataItem, i) => {
        dataBatches[i % this.cpus.length].push(dataItem);
        return dataBatches;
      },
      new Array(this.cpus.length).fill(0).map(() => [])
    );
  }

  private createFileForChildProcesses(callback: Callback): void {
    let childProcessWrapper = readFileSync(this.childProcessWrapper).toString();
    const fileContent = `
      const callback = ${callback.toString()}
    `;
    childProcessWrapper = childProcessWrapper.replace(
      "/* #callback# */",
      fileContent
    );
    writeFileSync(this.childProcessesFilePath, childProcessWrapper);
  }

  private forkProcesses(options: IOptions): ChildProcess[] {
    return this.cpus.reduce((forkedProcesses: ChildProcess[]) => {
      forkedProcesses.push(
        this.forkProcess(options.childProcess?.maxOldSpaceSize)
      );
      return forkedProcesses;
    }, []);
  }

  private forkProcess(maxOldSpaceSize?: number): ChildProcess {
    const options: ForkOptions = {};

    if (typeof maxOldSpaceSize === "number")
      options.execArgv = [`--max-old-space-size=${maxOldSpaceSize}`];

    return fork(this.childProcessesFilePath, options);
  }

  private executeForkedProcessesTroughIPCChannel(
    options: IOptions
  ): Promise<void> {
    return new Promise((resolve) =>
      this.forkedProcesses.forEach((forkedProcess, i) => {
        const pid = forkedProcess.pid as number;

        forkedProcess.on("message", (result) => {
          this.forkedProcessesResults[pid] = result;

          if (
            Object.keys(this.forkedProcessesResults).length === this.cpus.length
          ) {
            forkedProcess.kill();
            resolve();
          }
        });

        forkedProcess.send({
          data: this.dataBatches[i],
          params: { ...options.params, pid: pid },
        });
      })
    );
  }

  private generateRefinedResults(options: IOptions): any[] {
    let j = 0;

    return options.data.reduce((results: any[], value, i) => {
      const pid = this.forkedProcesses[i % this.cpus.length].pid as number;

      if (i !== 0 && i % this.cpus.length === 0) ++j;

      results.push(this.forkedProcessesResults[pid][j]);

      return results;
    }, []);
  }
}

module.exports = { ParallelExecutor };