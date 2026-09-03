# Snip design language

## Tokens

- **Background:** `#0b0a0c`; surfaces `#151318` and raised `#1b181f`
- **Text:** `#f5f1f2`; muted `#9b939d`; faint `#68616b`
- **Accent:** `linear-gradient(110deg, #ff9a72, #f36b83 52%, #a77bf3)`
- **Type:** Manrope for UI, DM Mono for labels and codes; display scale `42–76px`, section scale `25px`, body `13–15px`
- **Spacing:** 8px rhythm; hero breathing room `76px`; cards `30px` padding
- **Radii:** pill `999px`; cards `24px`; notices `14px`
- **Borders/shadows:** subtle white border `rgba(255,255,255,.1)`; card shadow `0 24px 80px rgba(0,0,0,.25)`
- **Glow:** fixed, full-width warm radial gradient behind the hero; it never captures pointer events

## Snip mapping

- Header and brand are the centered hero.
- URL form is the large pill/chat-style input with an attached gradient action.
- Success and error notices are compact tinted feedback surfaces.
- The links table is a generously rounded, translucent card with quiet dividers.
- Empty state uses the same muted type and accent spark as a gentle invitation.
