import { mergeHandlerMaps } from '../bullmq/types'
import { loggers } from '@/packages/lib/logger'

import { auditHandlerMap } from './audit'
import { emailHandlers } from './email'
import { authHandlers } from './auth'
import { accountHandlers } from './account'
import { fileHandlers } from './file'
import { fileExpiryHandlers } from './file-expiry'
import { billingHandlers } from './billing'
import { securityHandlers } from './security'
import { discordHandlers } from './discord'
import { adminDiscordHandlers } from './admin-discord'
import { adminHandlers } from './admin'
import { userHandlers } from './user'
import { nexiumHandlers } from './nexium'
import { applicationHandlers } from './applications'
import { storageHandlers } from './storage'

const logger = loggers.events.getChildLogger('handlers')

export const allHandlers = mergeHandlerMaps([
  auditHandlerMap,
  emailHandlers,
  authHandlers,
  accountHandlers,
  fileHandlers,
  fileExpiryHandlers,
  billingHandlers,
  securityHandlers,
  discordHandlers,
  adminDiscordHandlers,
  adminHandlers,
  userHandlers,
  nexiumHandlers,
  applicationHandlers,
  storageHandlers,
])

logger.debug('All event handler maps merged', { eventTypes: allHandlers.size })

export {
  getAuditEventsForUser,
  getRecentSecurityEvents,
  isAuditableEvent,
  AUDITABLE_EVENTS,
} from './audit'
export {
  scheduleFileExpiration,
  cancelFileExpiration,
  getFileExpirationInfo,
  getFileExpirationInfoBatch,
} from './file-expiry'
export { EMAIL_TEMPLATES } from './email'
