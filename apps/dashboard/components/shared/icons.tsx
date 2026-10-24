import Image from 'next/image'

import { BrandLogo } from './brand'

import {
  Infinity,
  AlertCircle,
  Copy,
  FileIcon,
  Loader2,
  Trash2,
  Users,
  CheckCircle,
  Download,
  RefreshCw,
  Sparkles,
} from 'lucide-react'

const EmberlyIconImage = (
  props: Omit<
    React.ComponentProps<typeof Image>,
    'src' | 'alt' | 'width' | 'height'
  >
) => (
  <Image src="/icon.svg" width={24} height={24} alt="Emberly Logo" {...props} />
)

export const Icons = {
  logo: BrandLogo,
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
