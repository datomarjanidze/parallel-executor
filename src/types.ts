export type Callback = (data: Data, params: IParams) => any | Promise<any>;

export interface IOptions {
  data: Data;
  params: { [key: string]: any };
  childProcess?: {
    maxOldSpaceSize?: number;
  };
}

export type Data = any[];

export type DataBatches = Data[];

export interface IParams {
  [key: string]: any;
  pid: number;
}

export interface IIPCChildProcessData {
  data: Data;
  params: IParams;
}
