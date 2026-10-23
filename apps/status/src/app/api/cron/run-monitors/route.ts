import { Socket } from 'node:net';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { CheckResult, MonitorType, AlertEvent } from '@prisma/client';
import { autoTransitionMaintenances } from '@/lib/maintenance';
import { SITE } from '@/lib/site';

interface TcpCheckResult {
    connected: boolean;
    /** First chunk received after connect, if a banner/response check was requested. null = none requested, or none arrived in time. */
    banner: string | null;
    error: string | null;
}

/**
 * Real TCP socket check: connects to host:port and, if a banner/response check
 * is requested, waits for the server's first bytes (e.g. SMTP sends a "220 ..."
 * greeting immediately on connect). This is deliberately protocol-agnostic: it
 * works for SMTP, databases, or any other raw TCP service, not just HTTP-shaped
 * ones, unlike a fetch()-based check would.
 */
function checkTcpSocket(host: string, port: number, timeoutMs: number, needsBanner: boolean): Promise<TcpCheckResult> {
    return new Promise((resolve) => {
        const socket = new Socket();
        let settled = false;
        let didConnect = false;

        const finish = (result: TcpCheckResult) => {
            if (settled) return;
            settled = true;
            socket.destroy();
            resolve(result);
        };

        socket.setTimeout(timeoutMs);
        socket.once('timeout', () => {
            // If we already connected, the port is reachable: a banner just never
            // arrived, which is a softer failure than the connection itself failing.
            finish(didConnect
                ? { connected: true, banner: null, error: null }
                : { connected: false, banner: null, error: 'Connection timed out' });
        });
        socket.once('error', (err) => finish({ connected: false, banner: null, error: err.message }));
        socket.once('connect', () => {
            didConnect = true;
            if (!needsBanner) {
                finish({ connected: true, banner: null, error: null });
                return;
            }
            socket.once('data', (chunk) => finish({ connected: true, banner: chunk.toString('utf8'), error: null }));
        });
        socket.connect(port, host);
    });
}

// Unauthenticated fetch() sends no User-Agent at all, which is one of the most
// common triggers for Cloudflare Bot Fight Mode / WAF heuristics to auto-block
// a request outright. Identifying ourselves honestly (with a link) is both more
// transparent and far more likely to pass than trying to spoof a browser UA:
// and it gives something concrete to allowlist via a Cloudflare custom rule
// (e.g. `(http.user_agent contains "Emberly-StatusMonitor")` → Skip).
const DEFAULT_MONITOR_HEADERS: Record<string, string> = {
    'User-Agent': `Emberly-StatusMonitor/1.0 (+${SITE.statusUrl}; automated uptime check)`,
    Accept: '*/*',
};

/**
 * GET /api/cron/run-monitors
 *
 * Called every 30s by the built-in scheduler (lib/monitor-scheduler.ts), or by
 * an external scheduler when MONITOR_SCHEDULER=false.
 * Secured with CRON_SECRET env var: set it to a long random string and pass it
 * as the Authorization header: `Bearer <CRON_SECRET>`
 */
export async function GET(request: Request) {
    const secret = process.env.CRON_SECRET;
    if (secret) {
        const auth = request.headers.get('authorization') ?? '';
        if (auth !== `Bearer ${secret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    const now = new Date();

    // Auto-start/complete scheduled maintenance windows before checking any
    // monitors this tick, so a window starting exactly now is already
    // IN_PROGRESS by the time down-alert suppression looks for it below.
    await autoTransitionMaintenances(now).catch((err) => console.error('[maintenance auto-transition] failed:', err));

    const monitors = await prisma.monitor.findMany({
        where: { status: 'ACTIVE' },
        select: {
            id: true, name: true, type: true, target: true, port: true,
            interval: true, timeout: true, lastCheckedAt: true,
            lastStatus: true, componentId: true,
            downThreshold: true, consecutiveFailures: true,
            headers: true, expectedStatusCodes: true, expectedBodyContains: true,
            bodyMatchType: true, expectedBodyValue: true,
            component: { select: { groupId: true } },
        },
    });

    const results: { id: string; name: string; result: CheckResult; responseMs: number | null; error?: string }[] = [];

    await Promise.allSettled(
        monitors.map(async (monitor) => {
            // Skip if checked recently (within interval - 5 second buffer)
            if (monitor.lastCheckedAt) {
                const secondsSince = (now.getTime() - monitor.lastCheckedAt.getTime()) / 1000;
                if (secondsSince < monitor.interval - 5) return;
            }

            let result: CheckResult = 'DOWN';
            let responseMs: number | null = null;
            let statusCode: number | null = null;
            let errorMsg: string | null = null;

            const start = Date.now();

            try {
                if (monitor.type === 'HTTP') {
                    const expectedStatusCodes = monitor.expectedStatusCodes ?? [];
                    const bodyMatchType = monitor.bodyMatchType;
                    const pattern = monitor.expectedBodyContains?.trim() || null;
                    const requestHeaders = { ...DEFAULT_MONITOR_HEADERS, ...(monitor.headers as Record<string, string> | null) };
                    const hasBodyCheck = bodyMatchType !== 'NONE' && !!pattern;
                    // A body check requires an actual body, so switch off HEAD when one is configured.
                    const method = hasBodyCheck ? 'GET' : 'HEAD';

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), monitor.timeout * 1000);
                    try {
                        const res = await fetch(monitor.target, {
                            method,
                            headers: requestHeaders,
                            signal: controller.signal,
                            redirect: 'follow',
                        });
                        clearTimeout(timeoutId);
                        responseMs = Date.now() - start;
                        statusCode = res.status;

                        const statusOk = expectedStatusCodes.length > 0
                            ? expectedStatusCodes.includes(res.status)
                            : (res.status >= 200 && res.status < 400);

                        let bodyOk = true;
                        if (statusOk && hasBodyCheck && pattern) {
                            const text = await res.text();
                            if (bodyMatchType === 'CONTAINS') {
                                bodyOk = text.includes(pattern);
                                if (!bodyOk) errorMsg = 'Response body did not contain the expected text';
                            } else if (bodyMatchType === 'REGEX') {
                                try {
                                    bodyOk = new RegExp(pattern).test(text);
                                    if (!bodyOk) errorMsg = 'Response body did not match the expected pattern';
                                } catch {
                                    bodyOk = false;
                                    errorMsg = 'Invalid regex pattern configured for this monitor';
                                }
                            } else if (bodyMatchType === 'JSON_PATH') {
                                try {
                                    const json = JSON.parse(text);
                                    const value = pattern.split('.').reduce<unknown>(
                                        (acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined),
                                        json,
                                    );
                                    bodyOk = String(value ?? '') === (monitor.expectedBodyValue ?? '');
                                    if (!bodyOk) errorMsg = `Expected "${monitor.expectedBodyValue}" at path "${pattern}", got "${value}"`;
                                } catch {
                                    bodyOk = false;
                                    errorMsg = 'Response body was not valid JSON';
                                }
                            }
                        }

                        if (statusOk && bodyOk) {
                            result = responseMs > monitor.timeout * 800 ? 'DEGRADED' : 'UP';
                        } else {
                            result = 'DOWN';
                        }
                    } catch (err) {
                        clearTimeout(timeoutId);
                        responseMs = Date.now() - start;
                        errorMsg = err instanceof Error ? err.message : String(err);
                        result = 'DOWN';
                    }
                } else if (monitor.type === 'PING') {
                    // True ICMP ping needs a raw socket (root/native module), which isn't
                    // available here: approximate reachability with an HTTP HEAD instead.
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), monitor.timeout * 1000);
                        await fetch(`http://${monitor.target}`, { method: 'HEAD', headers: DEFAULT_MONITOR_HEADERS, signal: controller.signal });
                        clearTimeout(timeoutId);
                        responseMs = Date.now() - start;
                        result = 'UP';
                    } catch {
                        responseMs = Date.now() - start;
                        result = 'DOWN';
                    }
                } else if (monitor.type === 'TCP') {
                    if (!monitor.port) {
                        errorMsg = 'TCP monitor is missing a port';
                    } else {
                        const bodyMatchType = monitor.bodyMatchType;
                        const pattern = monitor.expectedBodyContains?.trim() || null;
                        // A raw TCP socket: works for SMTP, databases, or any other
                        // non-HTTP service, unlike the old HTTP-HEAD-to-any-port approach.
                        const needsBanner = (bodyMatchType === 'CONTAINS' || bodyMatchType === 'REGEX') && !!pattern;

                        const check = await checkTcpSocket(monitor.target, monitor.port, monitor.timeout * 1000, needsBanner);
                        responseMs = Date.now() - start;

                        if (!check.connected) {
                            result = 'DOWN';
                            errorMsg = check.error ?? 'Connection failed';
                        } else if (needsBanner && pattern) {
                            if (check.banner === null) {
                                result = 'DOWN';
                                errorMsg = 'Connected, but no response was received before the timeout';
                            } else {
                                let bodyOk: boolean;
                                if (bodyMatchType === 'REGEX') {
                                    try {
                                        bodyOk = new RegExp(pattern).test(check.banner);
                                        if (!bodyOk) errorMsg = 'Response did not match the expected pattern';
                                    } catch {
                                        bodyOk = false;
                                        errorMsg = 'Invalid regex pattern configured for this monitor';
                                    }
                                } else {
                                    bodyOk = check.banner.includes(pattern);
                                    if (!bodyOk) errorMsg = 'Response did not contain the expected text';
                                }
                                result = bodyOk ? (responseMs > monitor.timeout * 800 ? 'DEGRADED' : 'UP') : 'DOWN';
                            }
                        } else {
                            result = responseMs > monitor.timeout * 800 ? 'DEGRADED' : 'UP';
                        }
                    }
                }
            } catch (err) {
                errorMsg = err instanceof Error ? err.message : String(err);
                result = 'DOWN';
                responseMs = Date.now() - start;
            }

            const prevStatus = monitor.lastStatus;

            // A single DOWN reading doesn't mean much on its own: it's
            // indistinguishable from a one-off blip on either end (a brief
            // network hiccup on the checker's own machine, a target that was
            // slow for one tick) versus a real outage. `result` above is the
            // raw, honest observation for this one check and is always what
            // gets logged to MonitorCheck history; `effectiveResult` is what
            // actually gets surfaced as the monitor/component's current
            // status and what alerts fire on, requiring `downThreshold`
            // consecutive DOWN readings in a row first. Recovery is never
            // debounced: any non-DOWN reading resets the streak and takes
            // effect immediately, since there's no false-positive risk in
            // reporting "up" a moment early.
            const consecutiveFailures = result === 'DOWN' ? monitor.consecutiveFailures + 1 : 0;
            const belowThreshold = result === 'DOWN' && monitor.lastStatus !== null && consecutiveFailures < monitor.downThreshold;
            const effectiveResult: CheckResult = belowThreshold ? (monitor.lastStatus ?? result) : result;

            // Map monitor CheckResult → ComponentStatus.
            // DOWN defaults to DEGRADED_PERFORMANCE: MAJOR_OUTAGE is an admin-declared severity via incidents.
            const componentStatusMap: Record<CheckResult, import('@prisma/client').ComponentStatus> = {
                UP: 'OPERATIONAL',
                DEGRADED: 'DEGRADED_PERFORMANCE',
                DOWN: 'DEGRADED_PERFORMANCE',
            };

            // Persist check result + update linked component if status changed
            const ops: import('@prisma/client').Prisma.PrismaPromise<unknown>[] = [
                prisma.monitorCheck.create({
                    data: {
                        monitorId: monitor.id,
                        result,
                        responseMs,
                        statusCode,
                        error: errorMsg,
                    },
                }),
                prisma.monitor.update({
                    where: { id: monitor.id },
                    data: {
                        lastCheckedAt: now,
                        lastStatus: effectiveResult,
                        lastResponseMs: responseMs,
                        consecutiveFailures,
                    },
                }),
            ];

            let hasActiveCoverage = false;

            if (monitor.componentId) {
                // Only update component status if no active (non-resolved) incident is currently
                // linked to this component: active incidents set a manual status that takes priority.
                const [activeIncidentLink, activeMaintenanceLink] = await Promise.all([
                    prisma.incidentComponent.findFirst({
                        where: {
                            componentId: monitor.componentId,
                            incident: { status: { not: 'RESOLVED' } },
                        },
                        select: { id: true },
                    }),
                    prisma.maintenanceComponent.findFirst({
                        where: {
                            componentId: monitor.componentId,
                            maintenance: { status: 'IN_PROGRESS' },
                        },
                        select: { id: true },
                    }),
                ]);

                hasActiveCoverage = !!activeIncidentLink || !!activeMaintenanceLink;

                if (!activeIncidentLink) {
                    ops.push(
                        prisma.statusComponent.update({
                            where: { id: monitor.componentId },
                            data: { status: componentStatusMap[effectiveResult] },
                        }),
                    );
                }
            }

            await prisma.$transaction(ops);

            results.push({ id: monitor.id, name: monitor.name, result, responseMs, error: errorMsg ?? undefined });

            // Fire alerts if status changed: but not for a component with an
            // active incident or maintenance window covering it. That status
            // change is expected and already communicated through the
            // incident/maintenance itself, not something worth separately
            // paging someone about. Compares against effectiveResult, not the
            // raw per-tick result, so a debounced DOWN reading that hasn't
            // crossed downThreshold yet doesn't page anyone.
            if (prevStatus !== effectiveResult && !hasActiveCoverage) {
                await fireAlerts(monitor.id, monitor.name, effectiveResult, prevStatus, monitor.component?.groupId ?? null);
            }
        }),
    );

    return NextResponse.json({ ran: results.length, results });
}

async function fireAlerts(monitorId: string, monitorName: string, result: CheckResult, prevStatus: CheckResult | null, groupId: string | null) {
    const event: AlertEvent = result === 'DOWN' ? 'DOWN' : result === 'DEGRADED' ? 'DEGRADED' : 'UP';

    const rules = await prisma.alertRule.findMany({
        where: {
            enabled: true,
            events: { has: event },
            OR: [
                { monitorId },
                ...(groupId ? [{ groupId }] : []),
            ],
        },
        include: { channel: true },
    });

    await Promise.allSettled(
        rules.map(async (rule) => {
            const { channel } = rule;
            if (!channel.enabled) return;

            const message = buildAlertMessage(monitorName, result, prevStatus);
            let success = false;
            let errorMsg: string | null = null;

            try {
                if (channel.type === 'DISCORD_WEBHOOK' || channel.type === 'SLACK_WEBHOOK' || channel.type === 'GENERIC_WEBHOOK') {
                    const cfg = channel.config as Record<string, string>;
                    const url = cfg.url;
                    if (!url) throw new Error('No webhook URL configured');

                    const payload = channel.type === 'DISCORD_WEBHOOK'
                        ? {
                            embeds: [{
                                title: message.title,
                                description: message.body,
                                color: result === 'UP' ? 0x16a34a : result === 'DEGRADED' ? 0xca8a04 : 0xdc2626,
                            }],
                        }
                        : channel.type === 'SLACK_WEBHOOK'
                        ? { text: `*${message.title}*\n${message.body}` }
                        : { event, monitor: monitorName, status: result, message: message.body };

                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                    success = res.ok;
                    if (!res.ok) errorMsg = `HTTP ${res.status}`;
                } else if (channel.type === 'EMAIL') {
                    // Email alerting via the existing email system can be plugged in here
                    success = true;
                }
            } catch (err) {
                errorMsg = err instanceof Error ? err.message : String(err);
            }

            await prisma.alertNotification.create({
                data: {
                    monitorId,
                    channelId: channel.id,
                    event,
                    message: message.body,
                    success,
                    error: errorMsg,
                },
            });
        }),
    );
}

function buildAlertMessage(monitorName: string, result: CheckResult, prevStatus: CheckResult | null) {
    const statusLabel = result === 'UP' ? '✅ Recovered' : result === 'DEGRADED' ? '⚠️ Degraded' : '🔴 Down';
    return {
        title: `${statusLabel}: ${monitorName}`,
        body: `Monitor **${monitorName}** is now **${result}**${prevStatus ? ` (was ${prevStatus})` : ''}.`,
    };
}
