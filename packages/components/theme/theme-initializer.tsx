import { getConfig } from '@/packages/lib/config'

export async function ThemeInitializer() {
  const config = await getConfig()
  const customColors = config.settings.appearance.customColors || {}
  const themeName = config.settings.appearance.theme || ''

  const cssVariables = Object.entries(customColors)
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
      return `--${cssKey}: ${value};`
    })
    .join('\n')

  return (
    <>
      <style
        id="theme-initializer"
        dangerouslySetInnerHTML={{
          __html: `:root {
          ${cssVariables}
          --radius: 0.75rem;
          --chart-1: 220 70% 50%;
          --chart-2: 160 60% 45%;
          --chart-3: 30 80% 55%;
          --chart-4: 280 65% 60%;
          --chart-5: 340 75% 55%;
        }`,
        }}
      />
      <script
        // ensure system/config theme is present as a data attribute on the client
        dangerouslySetInnerHTML={{
          __html: `try{document.documentElement.setAttribute('data-theme', ${JSON.stringify(
            themeName
          )});}catch(e){}`,
        }}
      />
    </>
  )
}
