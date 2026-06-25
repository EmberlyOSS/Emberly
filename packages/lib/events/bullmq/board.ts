import fs from 'fs'
import path from 'path'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import type {
  AppControllerRoute,
  AppViewRoute,
  BullBoardQueues,
  ControllerHandlerReturnType,
  IServerAdapter,
  UIConfig,
} from '@bull-board/api/typings/app'
import { eventQueue } from './queue'

const BOARD_BASE_PATH = '/api/admin/queues'

function matchPath(
  pattern: string,
  actual: string
): Record<string, string> | null {
  const pp = pattern.split('/').filter(Boolean)
  const ap = actual.split('/').filter(Boolean)
  if (pp.length !== ap.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) {
      params[pp[i].slice(1)] = decodeURIComponent(ap[i])
    } else if (pp[i] !== ap[i]) {
      return null
    }
  }
  return params
}

const MIME_TYPES: Record<string, string> = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

class NextServerAdapter implements IServerAdapter {
  private queues: BullBoardQueues = new Map()
  private viewsPath = ''
  private staticRoute = '/static'
  private staticPath = ''
  private entryRoute: AppViewRoute | null = null
  private apiRoutes: AppControllerRoute[] = []
  private errorHandler: (error: Error) => ControllerHandlerReturnType = (
    err
  ) => ({ status: 500, body: { error: err.message } })
  private uiConfig: UIConfig = {}

  setQueues(queues: BullBoardQueues): this {
    this.queues = queues
    return this
  }
  setViewsPath(p: string): this {
    this.viewsPath = p
    return this
  }
  setStaticPath(route: string, p: string): this {
    this.staticRoute = route
    this.staticPath = p
    return this
  }
  setEntryRoute(route: AppViewRoute): this {
    this.entryRoute = route
    return this
  }
  setErrorHandler(h: (error: Error) => ControllerHandlerReturnType): this {
    this.errorHandler = h
    return this
  }
  setApiRoutes(routes: AppControllerRoute[]): this {
    this.apiRoutes = routes
    return this
  }
  setUIConfig(config: UIConfig): this {
    this.uiConfig = config
    return this
  }

  async handleRequest(req: Request, slugPath: string): Promise<Response> {
    const method = req.method.toLowerCase()
    const url = new URL(req.url)
    const query: Record<string, string> = {}
    url.searchParams.forEach((v, k) => {
      query[k] = v
    })

    const staticPrefix = this.staticRoute.replace(/^\//, '')
    if (slugPath === staticPrefix || slugPath.startsWith(staticPrefix + '/')) {
      const rel = slugPath.slice(staticPrefix.length)
      const filePath = path.join(this.staticPath, rel)
      try {
        const data = await fs.promises.readFile(filePath)
        const ext = path.extname(filePath)
        return new Response(data, {
          headers: {
            'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      } catch {
        return new Response('Not Found', { status: 404 })
      }
    }

    if (slugPath === 'api' || slugPath.startsWith('api/')) {
      const apiPath = '/' + slugPath
      for (const route of this.apiRoutes) {
        const methods = Array.isArray(route.method)
          ? route.method
          : [route.method]
        if (!methods.includes(method as never)) continue
        const routes = Array.isArray(route.route) ? route.route : [route.route]
        for (const pattern of routes) {
          const params = matchPath(pattern, apiPath)
          if (params === null) continue
          try {
            let body: Record<string, unknown> = {}
            if (['post', 'put', 'patch'].includes(method)) {
              try {
                body = await req.json()
              } catch {}
            }
            const result = await route.handler({
              queues: this.queues,
              uiConfig: this.uiConfig,
              query,
              params,
              body,
              headers: Object.fromEntries(req.headers.entries()),
            })
            const status = result.status ?? 200
            if (typeof result.body === 'string') {
              return new Response(result.body, {
                status,
                headers: { 'Content-Type': 'text/plain' },
              })
            }
            return Response.json(result.body, { status })
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error(String(error))
            const result = this.errorHandler(err)
            return Response.json(result.body, { status: result.status ?? 500 })
          }
        }
      }
      return new Response('Not Found', { status: 404 })
    }

    if (this.entryRoute) {
      const entryPath = slugPath === '' ? '/' : '/' + slugPath
      const patterns = Array.isArray(this.entryRoute.route)
        ? this.entryRoute.route
        : [this.entryRoute.route]
      const isEntry = patterns.some(
        (p) => p === entryPath || matchPath(p, entryPath) !== null
      )
      if (isEntry) {
        try {
          const { name, params } = this.entryRoute.handler({
            basePath: BOARD_BASE_PATH + '/',
            uiConfig: this.uiConfig,
          })
          const template = await fs.promises.readFile(
            path.join(this.viewsPath, name),
            'utf-8'
          )
          const html = template
            .replace(/<%=\s*basePath\s*%>/g, params.basePath)
            .replace(/<%=\s*title\s*%>/g, params.title ?? 'Bull Board')
            .replace(/<%=\s*favIconDefault\s*%>/g, params.favIconDefault ?? '')
            .replace(
              /<%=\s*favIconAlternative\s*%>/g,
              params.favIconAlternative ?? ''
            )
            .replace(/<%-\s*uiConfig\s*%>/g, params.uiConfig)
            .replace(/<%=\s*uiConfig\s*%>/g, params.uiConfig)
          return new Response(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          })
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          return new Response(`Error rendering board: ${err.message}`, {
            status: 500,
          })
        }
      }
    }

    return new Response('Not Found', { status: 404 })
  }
}

const serverAdapter = new NextServerAdapter()

createBullBoard({
  queues: [new BullMQAdapter(eventQueue)],
  serverAdapter,
  options: {
    uiConfig: {
      boardTitle: 'Emberly Queue Monitor',
      hideDocsLink: false,
    },
  },
})

export { serverAdapter as bullBoardAdapter }
