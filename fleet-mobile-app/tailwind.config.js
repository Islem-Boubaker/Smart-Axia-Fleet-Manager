/** @type {import('tailwindcss').Config} */
export const darkMode = "class";
export const content = [
  "./app/**/*.{js,jsx,ts,tsx}",
  "./features/**/*.{js,jsx,ts,tsx}",
  "./shared/**/*.{js,jsx,ts,tsx}",
  "./store/**/*.{js,jsx,ts,tsx}",
  "./index.{js,jsx,ts,tsx}",
];
export const presets = [require("nativewind/preset")];
export const theme = {
  extend: {
    colors: {
      brand: {
        50: "#EEF6FF",
        100: "#D9EBFF",
        500: "#2D77FF",
        600: "#1F63E0",
        700: "#1B4FB5",
      },
      ink: {
        50: "#F8FAFC",
        100: "#E2E8F0",
        200: "#CBD5E1",
        700: "#334155",
        800: "#1E293B",
        900: "#0F172A",
      },
      success: {
        100: "#DCFCE7",
        600: "#16A34A",
      },
      warning: {
        100: "#FEF3C7",
        600: "#D97706",
      },
      danger: {
        100: "#FEE2E2",
        600: "#DC2626",
      },
    },
    boxShadow: {
      card: "0 10px 24px rgba(15, 23, 42, 0.08)",
      float: "0 12px 28px rgba(15, 23, 42, 0.18)",
    },
    borderRadius: {
      "3xl": "1.5rem",
    },
  },
};
export const plugins = [];
