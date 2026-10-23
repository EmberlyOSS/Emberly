export function DynamicBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      {}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background/95 pointer-events-none" />

      {}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent pointer-events-none" />

      {}
      <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-transparent to-secondary/15 pointer-events-none" />

      {}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent pointer-events-none" />

      {}
      <div className="absolute inset-0 bg-radial-gradient from-primary/5 via-transparent to-background/50 pointer-events-none" />

      {}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-radial from-accent/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-radial from-secondary/20 to-transparent rounded-full blur-2xl" />
      </div>
    </div>
  )
}
