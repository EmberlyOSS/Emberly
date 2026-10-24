/** "pending_review" or "BAN_APPEAL" → "Pending review" / "Ban appeal" */
export function humanize(value: string) {
  const text = value.replace(/[_-]+/g, ' ').toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}
