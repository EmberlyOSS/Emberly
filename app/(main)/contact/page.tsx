import ContactLinks from "@/components/contact/ContactLinks"
import ContactInfo from "@/components/contact/ContactInfo"

export const metadata = {
    title: "Contact | Emberly",
    description: "Get in touch with the Emberly team",
}

export default function ContactPage() {
    return (
        <main className="max-w-6xl mx-auto px-4 py-10">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold">Contact Us</h1>
                <p className="text-muted-foreground mt-2">Questions, feedback, or partnership inquiries we'd love to hear from you.</p>
            </header>

            <section className="grid gap-8 md:grid-cols-3 items-start">
                <div className="md:col-span-2">
                    <ContactLinks />
                </div>

                <aside className="md:col-span-1">
                    <ContactInfo />
                </aside>
            </section>
        </main>
    )
}
