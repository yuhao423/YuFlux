module.exports = {
  env: {
    node: true,
    jest: true,
    es6: true,
  },
  extends: ["eslint:recommended", "prettier"],
  overrides: [
    {
      env: {
        node: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
  // parser: "@typescript-eslint/parser",
  parserOptions: {
    // project: "tsconfig.json",
    // tsconfigRootDir: __dirname,
    // sourceType: "module",
    ecmaVersion: 2020, // 支持最新的 ECMAScript 特性
  },
  plugins: ["import"],
  rules: {
    "no-unused-vars": "off",
    // "@typescript-eslint/no-var-requires": "off",
    // "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "no-undef": 0,
    // "@typescript-eslint/no-explicit-any": 0,
    "no-multiple-empty-lines": ["error", { max: 1 }],
    "no-var": 2, // 禁止使用 var 声明变量
    "no-console": ["error",{ "allow": ["warn", "error"]}], //禁止使用 console.log
    "prefer-rest-params": 2, // 要求使用剩余参数而不是 arguments
    eqeqeq: 2, // 强制使用 === 和 !==
    "no-multi-spaces": 1, // 禁止使用多个空格
    "default-case": 1, // 要求 switch 语句中有 default 分支
    "no-dupe-args": 2, // 禁止 function 定义中出现重名参数
    "import/order": [
      2,
      {
        groups: [["builtin", "external", "internal"], "parent", "sibling", "index"],
        "newlines-between": "always",
      },
    ],
  },
};
