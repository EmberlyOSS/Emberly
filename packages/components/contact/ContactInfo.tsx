export default function ContactInfo() {
    return (
        <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-2">Contact addresses</h3>
            <p className="text-sm text-muted-foreground mb-4">Use the channels on the left for community and issues. These addresses are for specific inquiries:</p>

            <ul className="space-y-3 text-sm">
                <li>
                    <strong>General:</strong> <a href="mailto:hello@embrly.ca" className="text-primary">hello@embrly.ca</a>
                </li>
                <li>
                    <strong>Support:</strong> <a href="mailto:support@embrly.ca" className="text-primary">support@embrly.ca</a>
                </li>
                <li>
                    <strong>Press & Partnerships:</strong> <a href="mailto:press@embrly.ca" className="text-primary">press@embrly.ca</a>
                </li>
                <li>
                    <strong>Security:</strong> <a href="mailto:security@embrly.ca" className="text-primary">security@embrly.ca</a>
                </li>
            </ul>

            <div className="mt-4 text-sm text-muted-foreground">
                Expect responses within a few business days. For urgent issues, use the GitHub issues link to flag a problem.
            </div>
        </div>
    )
}
