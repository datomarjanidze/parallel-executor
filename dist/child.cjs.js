'use strict';

process.on('message', async (ipcChildProcessData) => {
    process.send((await callback(ipcChildProcessData.data, ipcChildProcessData.params)) || []);
});
