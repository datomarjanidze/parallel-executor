export declare type Callback = (data: Data, params: IParams) => any | Promise<any>;
export interface IOptions {
    data: Data;
    params: {
        [key: string]: any;
    };
    childProcess?: {
        maxOldSpaceSize?: number;
    };
}
export declare type Data = any[];
export declare type DataBatches = Data[];
export interface IParams {
    [key: string]: any;
    pid: number;
}
export interface IIPCChildProcessData {
    data: Data;
    params: IParams;
}
