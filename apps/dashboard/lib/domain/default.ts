import { prisma } from '@emberly/db'

function bareHost(domain: string) {
  return domain.replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

export async function defaultUploadDomain(
  userId: string,
  preferredUploadDomain?: string | null
): Promise<string | null> {
  if (preferredUploadDomain) return bareHost(preferredUploadDomain)
  const primary = await prisma.customDomain.findFirst({
    where: { userId, verified: true, isPrimary: true },
    select: { domain: true },
  })
  return primary?.domain ?? null
}
