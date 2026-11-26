# Method — Thursday 26 November 2026

## How the stories were chosen

Every story was checked against a source dated 26 November 2026 (or,
where marked **(B)**, a late-evening 25 November event first reported on
26 November in Asia-Pacific time — those belong to the 26 November news
cycle). Stories marked **(F)** are forecasts for the morning of
26 November. Anything that could not be dated to the day was left out;
the full exclusion list is in `stories.md`.

The build follows the pattern of the winning news-image finals
(17–22 November): 35–52 sourced stories was the winning range, but this
edition was built at ~00:15 UTC, when most of 26 November had not yet
happened in Europe and the Americas, so the honest verified count is 23
stories across 7 regions. What it keeps from the winners: a named lead
story, a world map with numbered dots, a UTC timeline, a date check
strip, sources on the page, and a layered layout (masthead, hero, three
leads, briefs, map + timeline) that reads clearly from the image alone.

## The lead

The strongest verified story of the day is the 100th Macy's
Thanksgiving Day Parade in New York: a record 100 inflatables, 26
floats, 10,000 marchers, 3 million spectators, stepping off at 8:30
a.m. from 77th Street and Central Park West. The hero photograph is a
photorealistic parade scene — giant fox, dinosaur and cat balloons over
a Manhattan avenue — with no readable text, no logos and no real people.

## Date check

26 November 2026 is a **Thursday** (verified with `date -d`).
The masthead and the date-check strip both say so. The 2025 trap was
avoided: 26 November 2025 was a Wednesday, and several Constitution Day
articles dated 26 November belong to 2025; the 2026 observance is
sourced from the PIB release only.

## Verification

- `node main.ts` run twice from unrelated working directories with
  fresh output folders produces byte-identical `entry.png`:
  sha256 `8fda7fdb246f018e73c1a82f3645a54753259a2a169a0f21e3fe0c840df04d30`,
  777,881 bytes, 1024×1024 PNG (under the 1 MiB gate).
- The output image was visually inspected: masthead weekday correct,
  no clipped or overlapping text, no garbled letters or digits, map
  dots separated where locations are close together.
- No base64 anywhere in `main.ts`; the hero is a separate asset file.
- Node 22, standard library only, no network access.

## Sources

Reuters, AP, People, PIB, Chess.com, Transport for NSW,
MarketIndex.com.au, NASA FIRMS, Newsdesk — per-story sources are listed
in `stories.md`.
