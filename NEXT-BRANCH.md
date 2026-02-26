# Next Branch Notes

## Landing Page — CLI Terminal

- [ ] Slightly lighter background for the CLI terminal
- [ ] Center the terminal on desktop (like previous behavior); only top-align (with more margin-top) and scroll when viewport is too short to contain full contents
- [ ] Fade terminal to background color when viewport height isn't enough — fully visible only when fully in viewport (consider snap scroll)
- [ ] Make terminal height and width responsive
- [ ] Increase terminal font size by 1.5px
- [ ] Add newline after `cat quickstart`-style commands before the response output
- [ ] Add newline before the first `$` command prompt
- [ ] Create wallet and fund it *before* any demo action (not after) — must be compatible with all three demos
- [ ] Show output inline for the poem demo — formatted nicely in the CLI (currently not showing; errors: `payee.toLowerCase` is undefined in `Session.ts:97`, 402 fetch failures)
- [ ] Fix live fetch error: `TypeError: undefined is not an object (evaluating 'payee.toLowerCase')` in `Session.ts:97` / `Terminal.tsx:519`
- [ ] Fix `InvalidAddressError` appearing in terminal
- [ ] Instead of immediately showing all three next prompts, ask the user if they'd like to do something else (less text, less vertical scrolling)
- [ ] Append transaction hash (truncated) and URL hyperlinked on the *same* line instead of a new line — reduce vertical growth
- [ ] Capitalize action words in CLI output: "Spent", "Refunded", "Deposit"
- [ ] Show output (like the poem) *before* the "closing" CLI response
- [ ] Remove "quit" entirely
- [ ] Add a `:reset` icon in top-left of terminal that resets its state
- [ ] Syntax highlight the `mpp` CLI outputs more — currently all grey text except the check icon
- [ ] Only Stripe demo works on localhost — Tempo and poem demos are broken (likely related to the `payee.toLowerCase` / `InvalidAddressError` issues above)

- [ ] Don't re-animate CLI contents on page refresh — restore previous contents instantly (persist state, invalidate after ~24h)
- [ ] Page should not scroll if content fits in viewport — currently scrolls unnecessarily

## Landing Page — Layout & Typography

- [ ] Change "Machine Payments" title on homepage to Geist Pixel (line version) — **push this to the next branch we create based on this one and sync all changes**
- [ ] Wrap title onto two lines; same width for description and title container
- [ ] Put "stripe/tempo" branding on top left of the page where logo would usually go

## Services Page

- [ ] Show MPP logo (like docs page) in top-left of services page — not there right now
