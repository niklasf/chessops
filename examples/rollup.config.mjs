import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default {
  input: ['src/read-pgn.ts'],
  output: {
    dir: 'dist',
  },
  plugins: [resolve(), terser({ output: { comments: false } }), typescript()],
};
