import type { InputOptions, RollupOptions } from 'rollup'

import typescriptPlugin from '@rollup/plugin-typescript'
import dtsPlugin from 'rollup-plugin-dts'

const distFolderName = 'dist'
const outputPath = `${distFolderName}/parallel-executor`
const childOutputPath = `${distFolderName}/child`
const commonInputOptions: InputOptions = {
  input: 'src/index.ts',
  plugins: [typescriptPlugin()]
}
const commonChildInputOptions: InputOptions = {
  input: 'src/child.ts',
  plugins: [typescriptPlugin()]
}

const config: RollupOptions[] = [
  {
    ...commonInputOptions,
    output: [
      {
        file: `${outputPath}.esm.js`,
        format: 'esm'
      }
    ]
  },
  {
    ...commonChildInputOptions,
    output: [
      {
        file: `${childOutputPath}.esm.js`,
        format: 'esm'
      }
    ]
  },
  {
    ...commonInputOptions,
    output: [
      {
        file: `${outputPath}.cjs.js`,
        format: 'cjs'
      }
    ]
  },
  {
    ...commonChildInputOptions,
    output: [
      {
        file: `${childOutputPath}.cjs.js`,
        format: 'cjs'
      }
    ]
  },
  {
    ...commonInputOptions,
    plugins: [commonInputOptions.plugins, dtsPlugin()],
    output: [
      {
        file: `${outputPath}.d.ts`,
        format: 'esm'
      }
    ]
  }
]

export default config
