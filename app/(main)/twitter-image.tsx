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
            {/* Ember icon */}
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              style={{ marginRight: '20px' }}
            >
              <path
                d="M12 2C10.5 6 8 8 6 10C4 12 3 14.5 3 17C3 20 5.5 22 9 22C7 20 7 17 9 14C11 11 12 9 12 6C12 9 13 11 15 14C17 17 17 20 15 22C18.5 22 21 20 21 17C21 14.5 20 12 18 10C16 8 13.5 6 12 2Z"
                fill={primaryColor}
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
