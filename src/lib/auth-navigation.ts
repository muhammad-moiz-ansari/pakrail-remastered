export function safeReturnTo(value?: string | null) {
  // Explicit destinations prevent open redirects, encoded slashes and auth loops.
  if (!value) return "/account";
  return /^(\/|\/account|\/booking\/(trains|classes|passengers|seats|review|payment))$/.test(
    value,
  )
    ? value
    : "/account";
}
