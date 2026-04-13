# 📡 SignalFoundry

> A marketing intelligence tool that scrapes the web, identifies content patterns, generates hooks tuned to your voice, and surfaces underserved product opportunities.

![Demo](DEMO_GIF_PLACEHOLDER)

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg) ![Python](https://img.shields.io/badge/python-3.12-blue.svg) ![FastAPI](https://img.shields.io/badge/FastAPI-009688.svg)

## What it does

SignalFoundry scrapes content across platforms and watches how people actually engage with it. It then studies your existing writing, generates hooks that match your voice, and points at product gaps that large companies are unlikely to fill. The goal is to turn scattered online signal into usable distribution and product decisions.

## Demo

![Demo](DEMO_GIF_PLACEHOLDER)

- Scrape recent content on any topic and surface engagement patterns
- Generate hooks tuned to your voice and best-performing content
- Identify underserved product niches with low giant-competition risk
- Run continuously in the background not just on demand

## Why I built this

I kept running into the same problem across my other projects: I could build the thing, but I had no reliable way to distribute it. So I built the distribution tool for myself. It is the only project in this portfolio with a real daily user, which is me, and that has kept it honest. Features that sound clever but do not get used get stripped out fast.

The product gap identification layer is the more interesting part. Plenty of tools generate hooks. Combining content scraping with opportunity analysis turns this into something closer to a strategic intelligence tool than a hook generator. Once you are already watching the conversation, you may as well ask what is missing from it, and whether a small team could actually build the missing piece before a giant rolls over it.

## Architecture

```
Scraping pipeline
    |
Engagement analysis + pattern detection
    |
Hook generation (voice-tuned)
    |
Product gap identification
    |
FastAPI + PostgreSQL
```

Key architectural decisions:

- Modular scraping pipeline, sources can be swapped or added without touching the analysis layer
- Voice tuning requires existing content as input, hooks are calibrated against high-performing posts, not generated from generic templates
- Product gap filter uses giant-buildability heuristic, opportunities that Meta, Google, or Anthropic would naturally own are deprioritised

## Key engineering challenges

- Voice preservation in hook generation, requires analysing stylistic patterns across existing content before generating anything new
- Engagement signal normalisation, like counts, shares, and comments have different weights across platforms. Normalisation layer makes them comparable
- Giant-buildability filter, heuristic based on market size, distribution moat requirements, and alignment with big tech roadmaps
- Continuous monitoring architecture, runs on a schedule not on demand, accumulating signal over time rather than producing one-shot reports

## Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI, Python 3.12 |
| Database | PostgreSQL |
| Scraping | BeautifulSoup, httpx |
| Intelligence | OpenAI API |

## Features

- Web scraping across multiple content sources
- Engagement pattern analysis and trend detection
- Hook generation tuned to your voice and existing content
- Product gap identification with low-competition filtering
- Giant-buildability heuristic to avoid crowded spaces
- Continuous background monitoring

## Running locally

```bash
# Install dependencies
pip install -r requirements.txt

# Start FastAPI
uvicorn app.main:app --reload
```

## Roadmap

- [ ] B2B SaaS productisation with agency pricing tier
- [ ] VC and accelerator research tool variant
- [ ] Galaxie distribution pipeline integration
- [ ] Automated posting scheduler

## License

Apache 2.0

---

*Built by [Maryam Yousuf](https://github.com/maryam-ai-dev)*
