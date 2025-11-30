const { FlatCompat } = require("@eslint/eslintrc");
const jsxA11y = require("eslint-plugin-jsx-a11y");

// __dirname is available by default in CommonJS
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "plugin:jsx-a11y/recommended"
  ),
  {
    plugins: {
      "jsx-a11y": jsxA11y,
    },
    rules: {
      "no-unused-vars": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      // You can override or add jsx-a11y rules here if needed
    },
  },
  // ...any other configs
];
