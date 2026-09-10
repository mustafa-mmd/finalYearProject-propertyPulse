import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "coverage/**",
      "New XLSX Worksheet.xlsx",
    ],
    rules: {
      // These React Compiler rules are advisory while this application stays
      // on React 18 without the compiler enabled.
      "react-hooks/error-boundaries": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
    },
  },
];

export default eslintConfig;
