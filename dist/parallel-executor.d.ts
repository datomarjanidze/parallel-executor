import { CpuInfo } from 'os';
import { ChildProcess } from 'child_process';

type Callback = (data: Data, params: IParams) => any | Promise<any>;
interface IOptions {
    data: Data;
    params: {
        [key: string]: any;
    };
    childProcess?: {
        maxOldSpaceSize?: number;
    };
}
type Data = any[];
type DataBatches = Data[];
interface IParams {
    [key: string]: any;
    pid: number;
}

declare class ParallelExecutor {
    readonly cpus: CpuInfo[];
    dataBatches: DataBatches;
    readonly childProcessWrapperPath: string;
    readonly childProcessesFilePath: string;
    forkedProcesses: ChildProcess[];
    forkedProcessesResults: {
        [key: string]: any;
    };
    execute(callback: Callback, options: IOptions): Promise<any>;
    private splitDataIntoBatches;
    private createFileForChildProcesses;
    private forkProcesses;
    private forkProcess;
    private executeForkedProcessesTroughIPCChannel;
    private generateRefinedResults;
    private onExit;
}

export { ParallelExecutor };
