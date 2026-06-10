// ESLint flat config — https://docs.expo.dev/guides/using-eslint/
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: [
      'node_modules/**',
      'android/**',
      'functions/lib/**',
      'functions/node_modules/**',
      '.expo/**',
      'lawnup-ui-reference/**',
      'logs/**',
    ],
  },
  {
    rules: {
      // The codebase intentionally uses console for Metro-visible diagnostics
      // (logger.ts pipes through console). Revisit when Sentry lands.
      'no-console': 'off',

      // React-Compiler-era rules from react-hooks v6 flag long-standing RN idioms
      // used throughout this codebase: `useRef(new Animated.Value()).current`
      // and Reanimated `sharedValue.value = …` writes inside event handlers.
      // Downgraded to warnings so lint surfaces real errors; clean up gradually.
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',

      // Apostrophes in JSX copy ("plant's") are fine in RN <Text>
      'react/no-unescaped-entities': 'off',
    },
  },
];
