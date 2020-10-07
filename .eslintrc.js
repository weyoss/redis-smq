module.exports = {
    parserOptions: {
        ecmaVersion: 9, // 2018
        sourceType: 'module'
    },
    env: {
        es6: true,
        node: true
    },
    extends: ['plugin:prettier/recommended', 'prettier/standard'],
    rules: {
        'no-unused-vars': 0,
        'no-use-before-define': 0,
        'no-prototype-builtins': 0,
        'import/no-dynamic-require': 0,
        'no-trailing-spaces': 0,
        'guard-for-in': 0,
        'no-restricted-syntax': 0,
        'no-param-reassign': 0,
        'no-empty': 0,
        'max-len': ['error', 120],
        strict: 0
    }
};
