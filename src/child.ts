import { Data, IParams, IIPCChildProcessData } from "./types";

declare const callback: (data: Data, params: IParams) => any[];

process.on("message", async (ipcChildProcessData: IIPCChildProcessData) => {
  /* #callback# */
  (process as any).send(
    (await callback(ipcChildProcessData.data, ipcChildProcessData.params)) || []
  );
});
