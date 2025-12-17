import React from 'react'

type Row = {
    method: string
    path: string
    auth?: string
    description?: string
}

export default function EndpointTable({ rows }: { rows: Row[] }) {
    return (
        <div className="overflow-x-auto rounded-lg border border-border/30 bg-background/20">
            <table className="w-full text-sm table-fixed">
                <thead className="text-left text-xs text-muted-foreground">
                    <tr>
                        <th className="px-4 py-3 w-20">Method</th>
                        <th className="px-4 py-3">Path</th>
                        <th className="px-4 py-3 w-32">Auth</th>
                        <th className="px-4 py-3">Description</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, idx) => (
                        <tr key={idx} className="hover:bg-background/30">
                            <td className="px-4 py-3 font-mono text-xs">{r.method}</td>
                            <td className="px-4 py-3 font-mono text-xs">{r.path}</td>
                            <td className="px-4 py-3 text-sm">{r.auth || 'None'}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{r.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
