import Image from 'next/image'

import { Infinity, AlertCircle, Copy, FileIcon, Loader2 } from 'lucide-react'

const EmberlyIcon = (
  props: Omit<
    React.ComponentProps<typeof Image>,
    'src' | 'alt' | 'width' | 'height'
  >
) => (
  <Image src="/icon.svg" width={24} height={24} alt="Emberly Logo" {...props} />
)

export const Icons = {
  logo: EmberlyIcon,
  spinner: Loader2,
  file: FileIcon,
  alertCircle: AlertCircle,
  copy: Copy,
  infinity: Infinity,
} as const
