import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { compare } from 'bcryptjs'
import { ShieldAlert } from 'lucide-react'
import { getServerSession } from 'next-auth'

import { ProtectedFile } from '@/packages/components/file/protected-file'
import { DynamicBackground } from '@/packages/components/layout/dynamic-background'
import { Footer } from '@/packages/components/layout/footer'
import { Icons } from '@/packages/components/shared/icons'
import { Avatar, AvatarFallback, AvatarImage } from '@/packages/components/ui/avatar'
import { Button } from '@/packages/components/ui/button'
import { Card } from '@/packages/components/ui/card'
import { Input } from '@/packages/components/ui/input'

import { authOptions } from '@/packages/lib/auth'
import { getConfig } from '@/packages/lib/config'
import { prisma } from '@/packages/lib/database/prisma'
import {
  buildDirectMediaMetadata,
  buildMinimalMetadata,
  buildRichMetadata,
} from '@/packages/lib/embeds/metadata'
import { findFileByUrlPath } from '@/packages/lib/files/lookup'
import { formatFileSize } from '@/packages/lib/utils'

export const dynamic = 'force-dynamic'

interface FilePageProps {
  params: Promise<{ userUrlId: string; filename: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

interface PrismaFile {
  id: string
  name: string
  urlPath: string
  visibility: 'PUBLIC' | 'PRIVATE'
  password: string | null
  userId: string
  mimeType: string
  size: number
  uploadedAt: Date
  path: string
  flagged: boolean
  user?: {
    name: string | null
    image: string | null
    urlId: string
  } | null
}

function prepareFileProps(file: PrismaFile) {
  const plainFile = JSON.parse(
    JSON.stringify({
      id: file.id,
      name: file.name,
      urlPath: file.urlPath,
      visibility: file.visibility,
      password: file.password,
      userId: file.userId,
      mimeType: file.mimeType,
      size: file.size,
      uploadedAt: file.uploadedAt,
      path: file.path,
      flagged: file.flagged,
      user: {
        name: file.user?.name || '',
        image: file.user?.image || undefined,
        urlId: file.user?.urlId || '',
      },
    })
  )

  return {
    id: plainFile.id,
    name: plainFile.name,
    urlPath: plainFile.urlPath,
    visibility: plainFile.visibility,
    password: plainFile.password,
    userId: plainFile.userId,
    mimeType: plainFile.mimeType,
    size: plainFile.size,
    uploadedAt: plainFile.uploadedAt,
    path: plainFile.path,
    flagged: plainFile.flagged,
    user: plainFile.user,
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: FilePageProps): Promise<Metadata> {
  const { userUrlId, filename } = await params
  const urlPath = `/${userUrlId}/${filename}`
  const headersList = await headers()
  const session = await getServerSession(authOptions)
  const providedPassword = (await searchParams).password as string | undefined

  // Find the file
  const file = await findFileByUrlPath(userUrlId, filename, {
    include: { user: { select: { name: true, image: true, urlId: true, enableRichEmbeds: true } } },
  })

  if (!file || !file.user) {
    return {}
  }

  // Check access permissions
  const isOwner = session?.user?.id === file.userId
  const isPrivate = file.visibility === 'PRIVATE' && !isOwner
  const isPasswordProtected = file.password && !isOwner

  // Build basic URLs
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const baseUrl = `${protocol}://${host}`
  const rawUrl = `${baseUrl}${urlPath}/raw`

  // Return minimal metadata for inaccessible or protected files
  if (isPrivate || isPasswordProtected) {
    return buildMinimalMetadata('Protected File')
  }

  // When rich embeds are disabled, point crawlers to the raw file URL
  // This preserves media inline behavior (video/image/audio) without branded cards.
  if (file.user.enableRichEmbeds === false) {
    return buildDirectMediaMetadata({
      fileName: file.name,
      rawUrl,
      mimeType: file.mimeType,
    })
  }

  // Build rich metadata for accessible files with rich embeds enabled
  return buildRichMetadata({
    baseUrl,
    fileUrlPath: urlPath,
    rawUrl,
    fileName: file.name,
    mimeType: file.mimeType,
    size: file.size,
    uploadedAt: file.uploadedAt,
    uploaderName: file.user.name || 'Anonymous',
  })
}

export default async function FilePage({
  params,
  searchParams,
}: FilePageProps) {
  const session = await getServerSession(authOptions)
  const config = await getConfig()
  const { userUrlId, filename } = await params
  const urlPath = `/${userUrlId}/${filename}`
  const providedPassword = (await searchParams).password as string | undefined

  let file = await findFileByUrlPath(userUrlId, filename, {
    include: { user: true },
  })

  if (!file) {
    notFound()
  }

  await prisma.file.update({
    where: { id: file.id },
    data: { views: { increment: 1 } },
  })

  const serializedFile = prepareFileProps(file)

  const isOwner = session?.user?.id === serializedFile.userId
  const isAdmin = (session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'SUPERADMIN'
  const isPrivate = serializedFile.visibility === 'PRIVATE' && !isOwner

  if (isPrivate) {
    notFound()
  }

  // Block flagged content for non-owners and non-admins
  if (serializedFile.flagged && !isOwner && !isAdmin) {
    return (
      <div className="flex-1 relative min-h-screen overflow-hidden">
        <DynamicBackground />
        <div className="absolute top-6 left-6 z-20">
          <div className="glass rounded-xl px-4 py-2">
            <Link href="/" className="flex items-center space-x-2.5">
              <Icons.logo className="h-6 w-6" />
            </Link>
          </div>
        </div>
        <main className="flex items-center justify-center p-6 relative z-10 min-h-screen">
          <Card className="w-full max-w-md glass">
            <div className="p-8 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-destructive" />
              </div>
              <h1 className="text-xl font-medium">Content Unavailable</h1>
              <p className="text-sm text-muted-foreground">
                This file has been flagged by our moderation team and is currently unavailable.
              </p>
              <Button asChild variant="outline" className="mt-2">
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  if (serializedFile.password && !isOwner) {
    const needsPassword = !providedPassword
    if (needsPassword) {
      return (
        <div className="flex-1 relative min-h-screen overflow-hidden">
          <DynamicBackground />
          <div className="absolute top-6 left-6 z-20">
            <div className="glass rounded-xl px-4 py-2">
              <Link href="/" className="flex items-center space-x-2.5">
                <Icons.logo className="h-6 w-6" />
              </Link>
            </div>
          </div>
          <main className="flex items-center justify-center p-6 relative z-10 min-h-screen">
            <Card className="w-full max-w-md glass">
                <div className="p-6">
                  <h1 className="text-xl font-medium text-center mb-4">
                    Password Protected File
                  </h1>
                  <p className="text-sm text-muted-foreground text-center mb-6">
                    This file requires a password to access
                  </p>
                  <form className="space-y-4" action={urlPath}>
                    <div className="space-y-2">
                      <Input
                        type="password"
                        name="password"
                        placeholder="Enter password"
                        className="bg-background/60 backdrop-blur-sm border-border/50"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Access File
                    </Button>
                  </form>
                </div>
              </Card>
            {/* Footer moved to global FooterWrapper in app/(main)/layout.tsx */}
          </main>
        </div>
      )
    }

    const isPasswordValid = await compare(
      providedPassword,
      serializedFile.password
    )
    if (!isPasswordValid) {
      return (
        <div className="flex-1 relative min-h-screen overflow-hidden">
          <DynamicBackground />
          <div className="absolute top-6 left-6 z-20">
            <div className="glass rounded-xl px-4 py-2">
              <Link href="/" className="flex items-center space-x-2.5">
                <Icons.logo className="h-6 w-6" />
              </Link>
            </div>
          </div>
          <main className="flex items-center justify-center p-6 relative z-10 min-h-screen">
            <Card className="w-full max-w-md glass">
                <div className="p-6">
                  <h1 className="text-xl font-medium text-center mb-4">
                    Incorrect Password
                  </h1>
                  <p className="text-sm text-muted-foreground text-center mb-6">
                    The password you entered is incorrect
                  </p>
                  <form className="space-y-4" action={urlPath}>
                    <div className="space-y-2">
                      <Input
                        type="password"
                        name="password"
                        placeholder="Enter password"
                        className="bg-background/60 backdrop-blur-sm border-border/50"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Try Again
                    </Button>
                  </form>
                </div>
              </Card>
            {/* Footer moved to global FooterWrapper in app/(main)/layout.tsx */}
          </main>
        </div>
      )
    }
  }

  const isImage = serializedFile.mimeType.startsWith('image/')
  const isVideo = serializedFile.mimeType.startsWith('video/')
  const isMediaFile = isImage || isVideo
  const uploadDate = new Date(serializedFile.uploadedAt)

  return (
    <div className="flex-1 relative min-h-screen overflow-hidden">
      <DynamicBackground />

      {/* Header bar */}
      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-20 flex items-center justify-between gap-2">
        <div className="glass rounded-xl px-3 py-2 sm:px-4 shrink-0">
          <Link href="/" className="flex items-center space-x-2.5">
            <Icons.logo className="h-5 w-5 sm:h-6 sm:w-6" />
          </Link>
        </div>

        <Link href={`/user/${serializedFile.user.name}`} className="glass glass-hover rounded-xl px-3 py-2 sm:px-4 transition-all">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Avatar className="h-6 w-6 sm:h-7 sm:w-7 ring-1 ring-white/10">
              <AvatarImage
                src={serializedFile.user.image}
                alt={serializedFile.user.name}
              />
              <AvatarFallback className="text-xs">
                {serializedFile.user.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs sm:text-sm font-medium max-w-[120px] sm:max-w-none truncate">
              {serializedFile.user.name}
            </span>
          </div>
        </Link>
      </div>

      <main
        className="flex items-center justify-center px-3 py-4 sm:p-6 relative z-10"
        style={{ minHeight: 'calc(100vh - 5rem)', paddingTop: '5rem' }}
      >
        <div className={`w-full ${isMediaFile ? 'max-w-4xl' : 'max-w-3xl'}`}>
          {/* Flagged notice for owners/admins */}
          {serializedFile.flagged && (isOwner || isAdmin) && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 backdrop-blur-sm px-4 py-3 text-sm text-destructive">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>This file has been flagged by moderation{isOwner && ' and is hidden from public view'}.</span>
            </div>
          )}

          <Card className={`overflow-hidden glass w-full ${serializedFile.flagged ? 'ring-1 ring-destructive/30' : ''}`}>
            {/* File info header */}
            <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-border/40">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm sm:text-base font-medium text-foreground/90 truncate">
                    {serializedFile.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground/60">
                    <span>{formatFileSize(serializedFile.size)}</span>
                    <span className="text-white/10">·</span>
                    <span>{uploadDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>

            <ProtectedFile file={serializedFile} />
          </Card>
        </div>
      </main>
    </div>
  )
}
