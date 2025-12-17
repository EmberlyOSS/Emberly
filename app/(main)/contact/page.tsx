import ContactLinks from "@/packages/components/contact/ContactLinks"
import ContactInfo from "@/packages/components/contact/ContactInfo"
import HomeShell from "@/packages/components/layout/home-shell"

export const metadata = {
    title: "Contact | Emberly",
    description: "Get in touch with the Emberly team",
}

export default function ContactPage() {
    return (
        <HomeShell>
            <div className="container space-y-6">
                <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
                    <div className="relative p-8">
                        <h1 className="text-3xl font-extrabold">Contact Us</h1>
                        <p className="text-muted-foreground mt-2">Questions, feedback, or partnership inquiries we'd love to hear from you.</p>
                    </div>
                </div>

                <div className="relative rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-black/10" />
                    <div className="relative p-8">
                        <section className="grid gap-8 md:grid-cols-3 items-start">
                            <div className="md:col-span-2">
                                <ContactLinks />
                            </div>

                            <aside className="md:col-span-1">
                                <ContactInfo />
                            </aside>
                        </section>
                    </div>
                </div>
            </div>
        </HomeShell>
    )
}
