module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "extends": "airbnb-base",
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-unused-vars":0,
        "no-use-before-define":0,
        "no-prototype-builtins":0,
        "import/no-dynamic-require":0,
        "no-trailing-spaces": 0,
        "guard-for-in":0,
        "no-restricted-syntax":0,
        "no-param-reassign":0,
        "no-empty":0,
        "max-len":["error", 120],
        "strict":0
    }
};