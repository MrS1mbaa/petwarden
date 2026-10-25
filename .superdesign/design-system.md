# PetWarden — Design System v2 "Bolder, more color"

## Product context
- Offline-first Android pet-care app (Expo / React Native). No account; all data stays on the device. One owner, one or more pets, with one active pet at a time.
- Jobs to be done: (1) see and tick off the daily checklist (meals, walks, custom tasks), (2) plan the week's habits and vet appointments, (3) keep a health record (weight trend, vaccines, vet visits, medication, allergies/notes, documents), (4) manage pet profiles, reminders, theme and backup.
- Tone: warm, playful, reassuring, never clinical. Short, friendly copy ("Your little paw, your little world").
- Mockup copy is English. Example pet: **Bubi**, a Pembroke Welsh Corgi, 3 yrs, 12.4 kg. Owner: **Dotta**.

## Information architecture
- Splash/Welcome → Onboarding (3 steps: name & species → photo, birthday, weight → daily schedule) → Tabs.
- Bottom tabs (4): **Home**, **Planner**, **Health**, **Profile**.
- Stack screens: Documents (from Health). Edits happen in **bottom sheets** (add/edit task, mood picker, reminder settings, health record editor, delete confirmation).

## Visual direction
Keep the existing soft, warm, tactile base: off-white canvas, soft "pillowy" cards, a dark ink hero card, capsule buttons, big rounded type. Add **bold, confident color** pulled from the corgi mascot (fur orange, sage scarf, butter, blush ears). Color carries meaning: each care category has its own color. The result should feel premium, playful and calm, never neon or rainbow.

## Color tokens (light)
| Token | Hex | Use |
|---|---|---|
| bg | #F7F5F0 | App canvas (warm off-white) |
| surface | #EDEAE3 | Default soft cards |
| surfaceRaised | #FFFFFF | Raised cards, inputs, tab bar |
| ink | #1E1E1E | Primary text, hero card, selected pills, active tab |
| textSecondary | #5E5B55 | Secondary text (AA) |
| textMuted | #8A867E | Decorative only |
| **corgi** (primary) | #F07A2B | Primary CTA, highlights, progress, today marker |
| corgiSoft | #FFE4D1 | Orange tint backgrounds (meals) |
| corgiDeep | #C85A14 | Text/icons on corgiSoft |
| **sage** | #6F9B62 | Walks, success, "done" states |
| sageSoft | #E1EEDA | Sage tint backgrounds |
| sageDeep | #3F6B35 | Text on sageSoft |
| **butter** | #FFC845 | Mood, celebration, streaks |
| butterSoft | #FFF3CC | Butter tint |
| **blush** | #F2A0A0 | Health / vet / vaccines |
| blushSoft | #FCE3E1 | Blush tint |
| blushDeep | #B6474B | Text on blushSoft, overdue |
| **sky** | #7DB3E8 | Medication / documents (secondary accent) |
| skySoft | #E2EEFA | Sky tint |
| error | #B3261E | Errors |
| onInk | #F7F5F0 | Text on ink / hero |
| heroMuted | #BDB8AE | Secondary text on hero |

Dark mode mirrors this: bg #171715, surface #252522, surfaceRaised #2E2E2A, ink #F2F0EA, with the same accents slightly lighter (corgi #FF9150, sage #8EC07F, butter #FFD466, blush #F5B1B1, sky #95C3F0) and soft tints at about 18% opacity over the surface.

**Category color mapping (strict):** Meals = corgi · Walks = sage · Mood/fun = butter · Vet, vaccines, health alerts = blush · Medication and documents = sky · Weight = ink with a corgi line on the chart.

Rules: one bold accent fill per card at most. Tints sit behind icons and in chips. The primary CTA is corgi orange with ink text (#1E1E1E) or white bold text at 16px or larger. No gradients except a very soft tint-to-transparent glow behind the mascot.

## Typography
- Family: **Space Grotesk** only (Medium 500, Bold 700). Do not introduce other fonts.
- Scale: display 44/48 bold (welcome, big numbers) · title 32/40 bold · section 20/28 bold · body 16/24 medium · label 13/18 medium (uppercase eyebrow labels use +4% tracking).
- Big numbers (weight, counts) are bold, tight tracking (-1px).

## Shape, spacing, elevation
- Radius: cards 28, small tiles/buttons/inputs 20, chips and CTAs pill (999).
- Spacing scale: 4, 8, 12, 16, 24, 32, 48. Screen side padding 24. Section gap 28–32. Row gap 12.
- Touch targets at least 48px. Primary CTA height 56.
- Elevation: soft, wide, low-contrast shadow (0 8px 24px rgba(30,30,30,0.08)) plus a 1px inner top highlight (rgba(255,255,255,0.7)). No hard borders, except a 1.5px ink outline on unselected checkboxes.
- Pet photos sit in a white 4px frame with radius 28 and often overlap a card edge (the signature hero composition).

## Components
- **Hero pet card:** ink background, radius 28; pet photo framed and overflowing top-left; name in title bold white; breed, age and weight as small chips; a mood capsule (white pill, butter emoji) overlapping the bottom-right edge.
- **Care task row:** soft card (surface) with a 44px category tile (tint background, colored illustration icon), title bold, time label, and a separate 64px square check tile. When done, the tile fills with sage and a white check appears, and the title gets a line-through at 60% opacity.
- **Progress ring / bar:** corgi orange on a corgiSoft track (e.g. "2 of 3 done today").
- **Stat tile (wellness):** soft card with a category tint icon tile, a big bold number and a label; a tiny sparkline is allowed.
- **Week strip:** 7 day pills 48×72, radius 20; the selected day is ink; today gets a corgi dot; days with tasks get colored micro-dots by category.
- **Pills/chips:** selected = ink fill with off-white text; unselected = surfaceRaised; category chips = tint + deep text.
- **Icon button:** 48×48 white raised square, radius 20, 24px rounded stroke icon (1.8 stroke).
- **Bottom sheet:** white, radius 28 top, grab handle, title row with close button, background blurred and dimmed 30%.
- **Inputs:** 56px, white raised, radius 20, label above in bold 16.
- **Floating tab bar:** white capsule, 76 high, 24 side margins, floating 16 above the bottom; the active tab is an ink pill with an off-white icon and label; inactive tabs show a grey icon and label.
- **Empty states:** a friendly mascot illustration (corgi), one-line headline, a short hint and a primary CTA.
- Icons: rounded stroke line icons (home, calendar, health clipboard, dog face, bell, plus, edit, clock, weight, paw). Paw-print motifs are used sparingly as faint decoration at 4–6% opacity in the top-right of screens.

## Motion (for reference)
Springy and gentle (damping 16, stiffness 190). Press scale 0.97 with a light haptic. The check tile pops to 1.12 with a confetti burst in category colors. Lists stagger 60ms. Sheets spring up. Reduced motion is respected.

## Accessibility
Body text at least 16. Secondary text #5E5B55 (AA). Never rely on color alone: categories also get an icon and a label. Touch targets at least 48.

## Brand assets
- Logo: the 3D black paw print (app icon), used in the welcome screen and the app header mark.
- Mascot: a 3D Pixar-style corgi with a sage scarf, used on the welcome screen, in empty states and in celebrations.
