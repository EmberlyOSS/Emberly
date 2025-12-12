export default function ContactLinks() {
    return (
        <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-3">Contact & community</h3>

            <ul className="space-y-3 text-sm">
                <li>
                    <a href="https://github.com/EmberlyOSS/Emberly/issues" target="_blank" rel="noreferrer" className="text-primary">Report an issue on GitHub</a>
                    <div className="text-muted-foreground text-xs">Bugs, build issues, or feature requests</div>
                </li>

                <li>
                    <a href="https://github.com/orgs/EmberlyOSS/discussions" target="_blank" rel="noreferrer" className="text-primary">Join the GitHub Discussions</a>
                    <div className="text-muted-foreground text-xs">Community help, ideas, and design discussion</div>
                </li>

                <li>
                    <a href="https://twitter.com/TryEmberly" target="_blank" rel="noreferrer" className="text-primary">Follow us on Twitter</a>
                    <div className="text-muted-foreground text-xs">Announcements and quick updates</div>
                </li>

                <li>
                    <a href="/discord" target="_blank" rel="noreferrer" className="text-primary">Community Discord</a>
                    <div className="text-muted-foreground text-xs">Real-time chat and support</div>
                </li>

                <li>
                    <a href="/docs" className="text-primary">Documentation & guides</a>
                    <div className="text-muted-foreground text-xs">How-to guides and API references</div>
                </li>
            </ul>

            <div className="mt-4 text-sm text-muted-foreground">
                Prefer email? See the addresses on the right for press, partnerships, and support.
            </div>
        </div>
    )
}
