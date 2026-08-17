import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  theme: {
    extend: {
      fontFamily: {
        glyph: ['"Segoe UI Symbol"', '"Noto Sans Symbols"', 'sans-serif']
      }
    }
  }
}
