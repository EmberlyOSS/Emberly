export default function Loading() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
            <output
                aria-label="Loading"
                className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-white"
            />
        </div>
    );
}
