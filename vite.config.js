import { defineConfig } from 'vite';
import { ViteEjsPlugin } from 'vite-plugin-ejs';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const db = JSON.parse(
  readFileSync(resolve(__dirname, 'db.json'), 'utf-8')
);
const courses = db.courses;

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
        auth:          resolve(__dirname, 'src/auth.html'),
      },
    },
  },
  plugins: [
    ViteEjsPlugin({
      courses,
    }),
  ],
});
