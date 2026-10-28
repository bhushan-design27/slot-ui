function App() {
  return (
    <main className="mx-auto max-w-(--layout-content-max) p-(--space-8)">
      <h1 className="text-(length:--font-size-heading) leading-(--font-line-height-heading) font-semibold text-(--color-text-primary)">
        Slot UI
      </h1>
      <p className="mt-(--space-2) text-(length:--font-size-body) leading-(--font-line-height-body) text-(--color-text-secondary)">
        Components live in Storybook. Run npm run storybook to browse them.
      </p>
    </main>
  )
}

export default App
