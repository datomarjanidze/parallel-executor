## parallel-executor

### Installation

```console
npm i parallel-executor
```

### Description

This is a Node.js package for process parallelization. It is intended
for taking advantage of multi-core CPU devices. For example if you want
to run a routine on a collection of an array e.g.

```typescript
const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const results = [];
const myRoutine = async (value: number) => {
  /* do some async job */
};

for (const dataItem of data) results.push(await myRoutine(dataItem));
```

This package will do this job quicker by:

- Splitting your data into balanced batches. The batch number will be
  determined by the number of cores the device CPU has. For example, if
  your CPU has 8 cores it will create 8 balanced batches and that will
  be:
  ```typescript
  [[1, 9], [2, 10], [3, 11], [4], [5], [6], [7], [8]];
  ```
- Then it will create your device-CPU-core-number child processes, by
  forking your callback in a separate file and establishing an IPC
  communication channel with them
- Then one by one it will pass these balanced batches to each forked
  process and each child process will execute the same callback with its
  batch
- After each child process is done processing, each will return its
  result
- Finally, when all the results will be ready, the main process
  will gether all the results in chronological order

### Usage example

```typescript
const { ParallelExecutor } = require("parallel-executor");

// `myTask` will be executed in child process.
const myTask = async (data: Data, params: IParams): Promise<number[]> => {
  const result: number[] = [];
  const myRoutine = (_dataItem: number): Promise<number> => {
    return new Promise((resolve) =>
      setTimeout(() => resolve(_dataItem + 1), 1e3)
    );
  };

  for (const dataItem of data) result.push(await myRoutine(dataItem));

  return result;
};
const options: IOptions = {
  data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  params: { dirname: __dirname },
  childProcess: {
    maxOldSpaceSize: 90,
  },
};

(async () => {
  const parallelExecutor = new ParallelExecutor();

  console.time("Parallel execution took");
  const result = await parallelExecutor.execute(myTask, options);
  console.timeEnd("Parallel execution took");
  // Parallel execution took: 2.043s

  console.log("result:", result);
  /**
   * result: [
   *   2, 3, 4,  5,  6,
   *   7, 8, 9, 10, 11,
   *   12
   * ]
   */
})();

// As opposed to parallel execution

(async () => {
  console.time("Non parallel execution took");
  await myTask(options.data, { ...options.params, pid: 1 });
  console.timeEnd("Non parallel execution took");
  // Non parallel execution took: 11.015s
})();
```

### ParallelExecutor class specs

- **execute(callback: Callback, options: IOptions)** (method):
  - params:
    - **callback:** (data: Data, params: IParams) => any | Promise<any>;
      - **Data:**
        ```typescript
        type Data = any[];
        ```
      - **IParams:**
        ```typescript
        interface IParams {
          // Parameters passed within the options object.
          [key: string]: any;
          // Child process id.
          pid: number;
        }
        ```
    - **options:**
      ```typescript
      interface IOptions {
        data: Data;
        /**
         * Custom params. Consider that `pid` is preserved by the
         * package.
         */
        params: { [key: string]: any };
        childProcess?: {
          /*
           * You can configure the child process's `--max-old-space-size`
           * with this parameter.
           */
          maxOldSpaceSize?: number;
        };
      }
      ```
  - The returned value is the merged results of the child processes.
    Type `any[]`
