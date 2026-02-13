// eslint.config.js

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    ignores: [
      "node_modules/",
      ".next/",
      "out/",
      "public/",
      "*.config.js",
      "*.config.ts",
      "*.config.mjs",
      "*.config.cjs",
      "coverage/",
      "next-env.d.ts", // ✅ Add this line to ignore the Next.js environment declaration file
    ],
  },
];

export default eslintConfig;