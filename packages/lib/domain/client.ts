export async function updateDomain(id: string, body: { domain?: string }) {
  const res = await fetch(`/api/domains/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', ...body }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Update failed: ${res.status} ${text}`)
  }
  return true
}

export async function deleteDomain(id: string) {
  const res = await fetch(`/api/domains/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Delete failed: ${res.status} ${text}`)
  }
  return true
}
