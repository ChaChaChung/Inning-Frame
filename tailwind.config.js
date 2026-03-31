/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // 定格九局 品牌色
        brand: {
          navy: '#1a3a5c',     // 深藍 - 主色
          red: '#c0392b',      // 棒球紅 - 強調色
          cream: '#fdf6e3',    // 米白 - 背景
          gold: '#f39c12',     // 金色 - 亮點
          green: '#27ae60',    // 綠色 - 勝場
          gray: '#7f8c8d',     // 灰色 - 次要文字
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
