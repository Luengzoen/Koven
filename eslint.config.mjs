import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const bannedDumpFiles = ['**/utils.ts', '**/helpers.ts', '**/types.ts', '**/common.ts']

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/out/**',
      '**/dist/**',
      '**/.data/**',
      '**/.npm-cache/**',
      '**/.electron-cache/**',
      '**/.electron-builder-cache/**',
      '**/scripts/**',
      '**/*.test.ts',
      'eslint.config.mjs',
      'vitest.config.ts',
      'electron.vite.config.ts'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/main/**/*.{ts,tsx}', 'src/preload/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: bannedDumpFiles.map((pattern) => ({
            group: [pattern],
            message: '禁止无名垃圾桶文件（utils/helpers/types/common）；用带名词的文件名。'
          }))
        }
      ]
    }
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'electron',
              message: '渲染进程禁止 import electron；经 window.koven 调用主进程。'
            },
            {
              name: 'node:fs',
              message: '渲染进程禁止 Node fs。'
            },
            {
              name: 'node:path',
              message: '渲染进程禁止 Node path。'
            },
            {
              name: 'fs',
              message: '渲染进程禁止 Node fs。'
            },
            {
              name: 'path',
              message: '渲染进程禁止 Node path。'
            }
          ],
          patterns: bannedDumpFiles.map((pattern) => ({
            group: [pattern],
            message: '禁止无名垃圾桶文件（utils/helpers/types/common）；用带名词的文件名。'
          }))
        }
      ]
    }
  },
  {
    files: ['src/preload/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'node:fs',
              message: 'preload 禁止 Node fs；只允许 electron。'
            },
            {
              name: 'fs',
              message: 'preload 禁止 Node fs；只允许 electron。'
            }
          ],
          patterns: [
            ...bannedDumpFiles.map((pattern) => ({
              group: [pattern],
              message: '禁止无名垃圾桶文件（utils/helpers/types/common）；用带名词的文件名。'
            })),
            {
              group: ['react', 'react-dom', 'react/*', 'react-dom/*'],
              message: 'preload 禁止 React。'
            }
          ]
        }
      ]
    }
  },
  {
    files: bannedDumpFiles,
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program',
          message: '禁止创建 utils.ts / helpers.ts / types.ts / common.ts。'
        }
      ]
    }
  }
)
