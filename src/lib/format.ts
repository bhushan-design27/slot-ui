/**
 * Slot date and time formats. The studio is in the US, so everything is
 * en-US (CLAUDE.md, "UI copy"): weeks start on Sunday, 12-hour times.
 * Screens and stories format dates with these helpers, never by hand.
 *
 *   formatDateLong      Tuesday, November 10
 *   formatDateShort     Tue, Nov 10
 *   formatTime          10:00 AM
 *   formatDateTimeLong  Tuesday, November 10 at 10:00 AM
 *   formatDateTimeShort Tue, Nov 10, 10:00 AM
 *   formatMonth         November 2026
 */
export const LOCALE = 'en-US'

/** Sunday, as in the US. */
export const WEEK_STARTS_ON = 0

// Intl puts a narrow no-break space (U+202F) before AM/PM in recent ICU
// versions and a plain space in older ones; normalise so strings match
// Figma and tests everywhere.
const normalise = (text: string) => text.replace(/[  ]/g, ' ')

const format = (options: Intl.DateTimeFormatOptions) => {
  const formatter = new Intl.DateTimeFormat(LOCALE, options)
  return (date: Date) => normalise(formatter.format(date))
}

export const formatDateLong = format({ weekday: 'long', month: 'long', day: 'numeric' })
export const formatDateShort = format({ weekday: 'short', month: 'short', day: 'numeric' })
export const formatTime = format({ hour: 'numeric', minute: '2-digit' })
export const formatMonth = format({ month: 'long', year: 'numeric' })

export const formatDateTimeLong = (date: Date) => `${formatDateLong(date)} at ${formatTime(date)}`
export const formatDateTimeShort = (date: Date) => `${formatDateShort(date)}, ${formatTime(date)}`
