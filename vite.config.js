import { defineConfig } from 'vite';
import { ViteEjsPlugin } from 'vite-plugin-ejs';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const courses = JSON.parse(
  readFileSync(resolve(__dirname, 'src/data/courses.json'), 'utf-8')
);

export default defineConfig({
  base: './',
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index:         resolve(__dirname, 'src/index.html'),
        courses:       resolve(__dirname, 'src/courses.html'),
        courseDetails: resolve(__dirname, 'src/course-details.html'),
        enrollment:    resolve(__dirname, 'src/enrollment.html'),
      },
    },
  },
  plugins: [
    ViteEjsPlugin({
      courses,
    }),
  ],
});
