import Image from 'next/image'

import { Infinity, AlertCircle, Copy, FileIcon, Loader2, Trash2, Users, CheckCircle, Download, RefreshCw, Sparkles } from 'lucide-react'

// Theme-aware Emberly logo as inline SVG
// Respects CSS custom properties for all theme modes including preset hues
const EmberlyIcon = ({
  className = '',
  ...props
}: React.SVGProps<SVGSVGElement> & { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 375 375"
    className={`h-6 w-6 ${className}`}
    {...props}
  >
    {/* Foreground part - uses CSS variable */}
    <path
      className="fill-foreground"
      d="M 133.605469 292.523438 C 119 250 140.367188 221.316406 163.433594 194.726562 C 185.085938 169.761719 209.632812 141.460938 203.160156 90.417969 C 202.625 86.183594 201.742188 82.175781 200.609375 78.34375 C 263.273438 144.074219 190.074219 264.175781 216.992188 262.679688 C 229.292969 261.992188 246.4375 231.386719 244.046875 158.132812 C 244.046875 158.132812 284.792969 212.761719 276.535156 267.296875 C 271.472656 300.714844 242.191406 342.46875 188.445312 334.503906 C 163.886719 330.863281 140.933594 313.871094 133.605469 292.523438"
    />
    {/* Primary part - uses CSS primary color */}
    <path
      className="fill-primary"
      d="M 184.242188 21.605469 C 184.242188 21.605469 180.738281 41.964844 189.011719 72.355469 C 197.183594 102.375 192.621094 125.648438 187.855469 138.554688 C 173.65625 177.011719 137.921875 193.757812 122.191406 234.230469 C 115.824219 250.605469 102.488281 306.734375 164.113281 335.5 C 164.113281 335.5 114.042969 325.144531 97.09375 280.464844 C 83.359375 244.253906 95.5 198.558594 133.40625 156.972656 C 188.738281 96.265625 157.191406 55.503906 184.242188 21.605469"
    />
  </svg>
)

// Fallback image-based logo for contexts where SVG won't work
const EmberlyIconImage = (
  props: Omit<
    React.ComponentProps<typeof Image>,
    'src' | 'alt' | 'width' | 'height'
  >
) => (
  <Image src="/icon.svg" width={24} height={24} alt="Emberly Logo" {...props} />
)

export const Icons = {
  logo: EmberlyIcon,
  logoImage: EmberlyIconImage,
  spinner: Loader2,
  file: FileIcon,
  alertCircle: AlertCircle,
  copy: Copy,
  trash: Trash2,
  infinity: Infinity,
  users: Users,
  check: CheckCircle,
  download: Download,
  refresh: RefreshCw,
  sparkles: Sparkles,
} as const
