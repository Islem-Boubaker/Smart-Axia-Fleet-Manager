/** @type {import('tailwindcss').Config} */
export const content = [
  "./app/**/*.{js,jsx,ts,tsx}",
  "./features/**/*.{js,jsx,ts,tsx}",
  "./shared/**/*.{js,jsx,ts,tsx}",
  "./store/**/*.{js,jsx,ts,tsx}",
  "./index.{js,jsx,ts,tsx}",
];
export const presets = [require("nativewind/preset")];
export const theme = {
  extend: {},
};
export const plugins = [];