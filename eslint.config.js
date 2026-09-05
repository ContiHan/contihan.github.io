const globals = require('globals');

module.exports = [
    {
        files: ['script.js', 'os-chrome.js', 'theme-init.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
            'no-undef': 'error',
            'no-case-declarations': 'error',
            'eqeqeq': ['error', 'smart'],
            'no-var': 'off',
            'prefer-const': 'error',
        },
    },
];
