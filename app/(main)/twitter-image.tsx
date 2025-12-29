import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Emberly - Simple, predictable file hosting'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  // Hawkins Neon theme colors (Stranger Things inspired)
  const backgroundColor = 'hsl(232, 36%, 6%)'
  const primaryColor = 'hsl(354, 82%, 52%)' // Neon red
  const accentColor = 'hsl(197, 92%, 54%)' // Neon blue
  const foregroundColor = 'hsl(210, 40%, 96%)'
  const mutedColor = 'hsl(215, 16%, 72%)'

  return new ImageResponse(
    (
      <div
        style={{
          background: backgroundColor,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Gradient overlay for depth */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(ellipse at 30% 20%, hsla(354, 82%, 52%, 0.15) 0%, transparent 50%),
                        radial-gradient(ellipse at 70% 80%, hsla(197, 92%, 54%, 0.15) 0%, transparent 50%)`,
          }}
        />

        {/* Grid lines for retro effect */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: `linear-gradient(to bottom, transparent, hsla(354, 82%, 52%, 0.1))`,
            display: 'flex',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            padding: '60px',
          }}
        >
          {/* Logo / Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            {/* Emberly Logo SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 375 375"
              width="80"
              height="80"
              style={{ marginRight: '20px' }}
            >
              <path
                style={{ fill: foregroundColor }}
                d="M 133.605469 292.523438 C 119 250 140.367188 221.316406 163.433594 194.726562 C 185.085938 169.761719 209.632812 141.460938 203.160156 90.417969 C 202.625 86.183594 201.742188 82.175781 200.609375 78.34375 C 263.273438 144.074219 190.074219 264.175781 216.992188 262.679688 C 229.292969 261.992188 246.4375 231.386719 244.046875 158.132812 C 244.046875 158.132812 284.792969 212.761719 276.535156 267.296875 C 271.472656 300.714844 242.191406 342.46875 188.445312 334.503906 C 163.886719 330.863281 140.933594 313.871094 133.605469 292.523438"
              />
              <path
                style={{ fill: primaryColor }}
                d="M 184.242188 21.605469 C 184.242188 21.605469 180.738281 41.964844 189.011719 72.355469 C 197.183594 102.375 192.621094 125.648438 187.855469 138.554688 C 173.65625 177.011719 137.921875 193.757812 122.191406 234.230469 C 115.824219 250.605469 102.488281 306.734375 164.113281 335.5 C 164.113281 335.5 114.042969 325.144531 97.09375 280.464844 C 83.359375 244.253906 95.5 198.558594 133.40625 156.972656 C 188.738281 96.265625 157.191406 55.503906 184.242188 21.605469"
              />
            </svg>
            <span
              style={{
                fontSize: '72px',
                fontWeight: 700,
                color: foregroundColor,
                letterSpacing: '-2px',
              }}
            >
              Emberly
            </span>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontSize: '32px',
              color: mutedColor,
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            Simple, predictable file hosting with features that matter
          </p>

          {/* Feature pills */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '40px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {['Expirations', 'Custom Domains', 'Usage Controls', 'Privacy-First'].map(
              (feature) => (
                <div
                  key={feature}
                  style={{
                    background: 'hsla(230, 28%, 16%, 0.8)',
                    border: `1px solid hsla(354, 82%, 52%, 0.3)`,
                    borderRadius: '9999px',
                    padding: '12px 24px',
                    fontSize: '20px',
                    color: foregroundColor,
                  }}
                >
                  {feature}
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(to right, ${primaryColor}, ${accentColor})`,
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
