import React from 'react'

export default function Facts() {
  const quick = [
    { k: 'Type', v: 'Fan-made hub (non-affiliated)' },
    { k: 'Theme', v: "80s sci-fi horror synthy atmosphere" },
    { k: 'Purpose', v: 'Countdowns, notes, and non spoiler community content' },
  ]

  const tips = [
    'Avoid spoilers in comments use spoiler tags if discussing plot.',
    'Check official channels for exact release windows in your region.',
    'Consider enabling notifications for trailers or release announcements.',
  ]

  return (
    <div className="grid gap-4">
      <div className="bg-gradient-to-r from-[#071029] to-[#0b1220] border border-border rounded-lg p-4 shadow">
        <h3 className="text-lg font-semibold mb-2">Quick info</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
          {quick.map((q) => (
            <div key={q.k} className="">
              <dt className="text-xs text-muted-foreground">{q.k}</dt>
              <dd className="font-medium">{q.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="bg-background/40 border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Watch & release notes</h3>
        <p className="text-sm text-muted-foreground mb-2">Release dates and volumes vary by distributor and region. This hub tracks broadly available windows; for exact times check the official streaming platform.</p>

        <h4 className="font-medium mt-2">Viewing tips</h4>
        <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
          {tips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>

      <div className="bg-background/30 border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Non spoiler cast & crew notes</h3>
        <p className="text-sm text-muted-foreground">Core creative leads and principal cast have been consistent across seasons; expect familiar collaborations and practical effects/sound design focused on atmosphere.</p>
      </div>
    </div>
  )
}
