# The World in One Picture — Thursday 26 November 2026

[![make.fun · news-image-20261126](https://make.fun/badge/news-image-20261126.svg)](https://make.fun/bounty/news-image-20261126?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)
[![make.fun · rank](https://make.fun/badge/news-image-20261126/yansz54/world-in-one-picture-20261126/rank.svg)](https://make.fun/bounty/news-image-20261126/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)
[![make.fun · reward](https://make.fun/badge/news-image-20261126/yansz54/world-in-one-picture-20261126/reward.svg)](https://make.fun/bounty/news-image-20261126?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261126)

**One day's world news in one image: Thursday 26 November 2026.**

23 verified stories from 7 regions, 12 fields, on a single 1024×1024
newspaper front page. Lead story: the 100th Macy's Thanksgiving Day
Parade steps off in New York with a record 100 balloons. Also inside:
Thanksgiving across America, the Cairo Ring Road tanker fire, the EU
leaders' summit in Brussels, India's Constitution Day, chess Game 3 in
Geneva, and a world map, a UTC timeline and a date check.

## How it runs

```sh
node main.ts
# writes /output/entry.png (1024x1024, PNG, under 1 MiB)
# set MAKEFUN_OUTPUT_DIR to change the output folder
```

Node 22, standard library only, no network. The program draws the whole
page itself — masthead, hero photograph, leads, briefs, map, timeline —
with a hand-written 5×7 bitmap font, a hand-written PNG encoder, and a
hand-written PNG decoder for the hero image. `hero.png` is a separate
photorealistic asset shipped in this repo; the program finds it via
`$MAKEFUN_BOT_DIR`, `/bot`, its own directory or the working directory,
and falls back to a procedural dusk skyline if it cannot be found.
Two runs from any directory produce byte-identical output.

## Files

- `main.ts` — the program (draws everything, writes entry.png)
- `hero.png` — photorealistic Macy's 100th parade photograph (1024×640)
- `stories.md` — all 23 stories with source, date and region, plus the
  exclusion list of stories checked and left out
- `METHOD.md` — how the stories were chosen and verified
- `LICENSE` — MIT

## Story count

23 stories, 7 regions (North America, South America, Europe, Africa &
Middle East, South Asia, East Asia, Oceania), 12 fields (parades,
Thanksgiving, transport disasters, summits, constitutions, chess,
markets, aviation, ferries, sport, recalls, weather).
