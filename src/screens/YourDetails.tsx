import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Disclosure } from '@/components/ui/disclosure'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const summary = [
  { term: 'Service', detail: 'Deep tissue massage' },
  { term: 'Duration', detail: '60 min' },
  { term: 'Date and time', detail: 'Tuesday 4 November at 10:00' },
  { term: 'Price', detail: '$95' },
]


function SummaryDetails() {
  return (
    <dl className="flex w-full flex-col gap-(--space-3)">
      {summary.map(({ term, detail }) => (
        <div key={term} className="flex flex-col gap-(--space-1)">
          {/* Body/Small */}
          <dt className="text-(length:--font-size-small) leading-(--font-line-height-small) text-(--color-text-secondary)">
            {term}
          </dt>
          {/* Body/Medium */}
          <dd className="text-(length:--font-size-body) leading-(--font-line-height-body)">{detail}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Step 3 of 4 in booking an appointment: the person's contact details. */
export function YourDetails() {
  return (
    <main className="min-h-screen bg-(--color-surface-page) px-(--space-4) py-(--space-8) text-(--color-text-primary) lg:px-(--space-8)">
      <div className="mx-auto flex w-full max-w-(--layout-content-max) flex-col gap-(--space-8)">
        <header className="flex flex-col gap-(--space-2)">
          {/* Body/Small */}
          <p className="text-(length:--font-size-small) leading-(--font-line-height-small) text-(--color-text-secondary)">
            Step 3 of 4
          </p>
          {/* Heading/Large */}
          <h1 className="text-(length:--font-size-heading) leading-(--font-line-height-heading) font-semibold">
            Your details
          </h1>
        </header>

        <div className="flex flex-col gap-(--space-8) lg:flex-row-reverse lg:items-start lg:justify-end">
          {/*
           * Summary first in the DOM: above the form on mobile, beside it
           * (right) on desktop. Mobile shows the compact Disclosure, desktop
           * the full Card; the hidden one is display:none, so only one is in
           * the accessibility tree.
           */}
          <aside aria-label="Booking summary" className="w-full lg:max-w-(--layout-form-max) lg:flex-1">
            <Disclosure className="lg:hidden" summary="Deep tissue massage" detail="Tue 4 Nov, 10:00 · $95">
              <SummaryDetails />
            </Disclosure>
            <Card className="hidden lg:flex" title="Booking summary">
              <SummaryDetails />
            </Card>
          </aside>

          <form
            aria-label="Your details"
            className="flex w-full max-w-(--layout-form-max) flex-col gap-(--space-8)"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="flex flex-col gap-(--space-6)">
              <Input label="Full name" name="name" autoComplete="name" required />
              <Input
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                required
                helper="We'll send your confirmation here."
              />
              <Input
                label="Phone number"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                helper="So we can reach you if your appointment changes."
              />
              <Textarea
                label="Notes for your therapist (optional)"
                name="notes"
                helper="Injuries, pressure preferences or anything else they should know."
              />
            </div>

            {/* Continue sits on top on mobile, on the right on desktop. */}
            <div className="flex flex-col-reverse gap-(--space-4) sm:flex-row sm:justify-end">
              <Button variant="secondary" size="large">
                Back
              </Button>
              <Button variant="primary" size="large" type="submit">
                Continue
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
