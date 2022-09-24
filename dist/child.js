"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.on("message", async (ipcChildProcessData) => {
    /* #callback# */
    process.send(await callback(ipcChildProcessData.data, ipcChildProcessData.params));
});
