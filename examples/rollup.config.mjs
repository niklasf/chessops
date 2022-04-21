import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default {
  input: ['src/read-pgn.ts'],
  output: {
    dir: 'dist',
    extname: 'mjs',
  },
  plugins: [resolve(), terser({ output: { comments: false } }), typescript()],
};
