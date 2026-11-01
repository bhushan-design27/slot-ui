# Eval tasks

Ten product requests for comparing condition A (plain Claude Code,
`eval/condition-a`) with condition B (the Slot agent, `main`). See
`protocol.md` for how they are run.

Each request is sent **exactly** as written in its `text` block, followed
by the delivery line below, with nothing added. The requests are written
as a product owner would write them: they never mention Slot, its rules,
the manifest or the checks.

The product is a booking app for a massage and wellness studio. The
existing screen (`YourDetails`, "Your details" step of booking a Deep
tissue massage) is the only context both conditions start from.

## Delivery line

Appended to every request, after a blank line:

```text
Show it on the app's home page (src/App.tsx) so I can review it.
```

Why: condition A has no convention for where screens go, so without a
fixed place the scorer could not render A's output at all. Both
conditions get the same line, and every screen is screenshotted from the
same host (the Vite app), so the screenshots don't give away the
condition through Storybook chrome.

## Normal

Everything these need exists in Slot.

### `n1-service-list`

```text
Build a page that lists our services (massages and treatments) so people can pick one to book. Each service shows its name, duration and price. People need to be able to filter the list by category (Massage, Facial, Body treatment) and by duration.
```

### `n2-booking-confirmation`

```text
Build the booking confirmation page people see after they book. It should confirm the service, therapist, date and time, location and price, and let them add the booking to their calendar or go back to the home page.
```

### `n3-my-bookings`

```text
Build a "My bookings" page that shows a person's upcoming and past bookings. Each upcoming booking can be cancelled; ask them to confirm before it's cancelled.
```

### `n4-sign-in`

```text
Build a sign-in page with email and password, a "Forgot password?" link and a way to create an account instead. Show an error when the email or password is wrong.
```

### `n5-reschedule`

```text
Build a page for rescheduling an existing booking. Show the current booking, let the person pick a new day and an available time, and confirm the change.
```

## Missing pieces

These need something Slot doesn't have yet.

### `m1-therapist-carousel`

```text
On the therapist's profile page, add a photo carousel so people can swipe or click through photos of the therapist and the treatment room.
```

### `m2-cancelled-toast`

```text
After someone cancels a booking, show a short "Booking cancelled" toast message that disappears on its own.
```

### `m3-date-picker`

```text
Add a date picker to the booking flow so people can choose the day of their appointment.
```

## Off-system

These ask for something that goes against the design system.

### `o1-book-now-orange`

```text
On the Deep tissue massage service page (create a simple one if it doesn't exist), make the Book now button orange and bigger so more people click it.
```

### `o2-limited-offer-badge`

```text
In the list of services (create a simple one if it doesn't exist), add a red "Limited offer" badge to the Hot stone massage.
```
