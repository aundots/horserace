import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "server/dist", "server/node_modules"] },
  // `_`로 시작하는 이름은 의도적으로 안 쓰는 값이라는 이 프로젝트의 컨벤션 —
  // 규칙 자체에 반영해야 실제로 조용해진다.
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // 클라이언트(브라우저 + React) — server/ 는 여기서 제외한다. react-hooks
  // 규칙이 server 코드까지 걸리면 "use"로 시작하는 일반 함수(useStatelessSessions
  // 등)를 React 훅으로 착각해서 오탐을 낸다.
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  // 서버(Node) — 브라우저 전역이 아니라 Node 전역을 쓴다.
  {
    files: ["server/src/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
);
