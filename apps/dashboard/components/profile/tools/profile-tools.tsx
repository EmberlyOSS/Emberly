'use client'

import { Separator } from '@/components/ui/separator'

import { BashTool } from './bash-tool'
import { FlameshotTool } from './flameshot-tool'
import { FlickerTool } from './flicker-tool'
import { ShareXTool } from './sharex-tool'
import { SpectacleTool } from './spectacle-tool'
import { UploadHost } from './upload-host'

export function ProfileTools() {
  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <UploadHost />

        <Separator />

        <FlickerTool />

        <Separator />

        <ShareXTool />

        <Separator />

        <FlameshotTool />

        <Separator />

        <SpectacleTool />

        <Separator />

        <BashTool />
      </div>
    </div>
  )
}
