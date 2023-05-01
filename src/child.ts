import { Data, IParams, IIPCChildProcessData } from './types'

declare const callback: (data: Data, params: IParams) => any[]

process.on('message', async (ipcChildProcessData: IIPCChildProcessData) => {
  // This line is used by the `ParallelExecutor` class.
  console.log('callback')
  ;(process as any).send(
    (await callback(ipcChildProcessData.data, ipcChildProcessData.params)) || []
  )
})
