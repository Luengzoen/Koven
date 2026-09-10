import {
  fontFamilyCss,
  fontSizeScale,
  type GeneralPreferences
} from '@shared/capabilities/preferences'

/** 把字体族 / 字号档位写到 html CSS 变量，驱动 @theme 阶梯与 body 字体 */
export function applyTypography(general: Pick<GeneralPreferences, 'fontFamily' | 'fontSize'>): void {
  const root = document.documentElement
  root.style.setProperty('--font-scale', String(fontSizeScale(general.fontSize)))
  root.style.setProperty('--font-sans-family', fontFamilyCss(general.fontFamily))
}
