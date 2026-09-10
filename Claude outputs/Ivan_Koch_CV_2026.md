<!--
MASTER CV — edit this file, then re-render the PDF.
Tailor per opportunity: (1) the title line, (2) the last sentence of the summary,
(3) the order of Core Competencies. Everything else should rarely change.
Triaperformance figures come from the latest monthly close (currently Aug 2026) —
update them when a new close lands.
Format rules the renderer relies on:
  ### Role — Company | Dates      (the " | " puts the dates on the right)
  a paragraph that is only **bold text** becomes a sub-heading
-->

# IVAN KOCH

**Operations & P&L Leader who builds production AI systems  |  COO · VP Operations · General Manager**

Argentina — full remote  |  +54 11 3396 2194  |  ivankoch87@gmail.com  |  [linkedin.com/in/ivankoch](https://linkedin.com/in/ivankoch/)  |  [triaperformance.com/ai-systems](https://triaperformance.com/ai-systems/)

## Executive Summary

Operating executive with 10+ years leading P&L, operations and cross-functional teams across SaaS, fintech and on-demand marketplaces (ClickGuard, Uber, Mercado Libre, Binance, OneLocal). Most recently COO/Integrator of a bootstrapped B2B SaaS, taking it from a –$38K EBITDA loss in 2025 to +$100K EBITDA in H1 2026 — 6x plan — in under six months. Builds the operating systems that make growth repeatable (EOS, scorecards, business reviews) and, unusually for an operator, the AI systems too: designs, ships and runs a self-hosted production stack of LLM agents, n8n workflows, CRM, Postgres and token-level cost accounting. Finance degree and MBA.

## Core Competencies

P&L Ownership & Turnarounds  •  EOS / OKR Operating Systems  •  AI Systems & Agent Orchestration  •  Workflow Automation & Integrations (n8n, APIs)  •  Data Infrastructure & Analytics (SQL, BigQuery)  •  Revenue Operations & Retention  •  Team Restructuring & Change Management  •  Pricing & Packaging

## Professional Experience

### Founder & Operator — Triaperformance | Aug 2022 – Present

*Endurance coaching business (running & triathlon) in three languages, run solo alongside full-time executive roles — and the production environment where I design, build and operate AI systems.*

- Grew from one athlete to 40+ coached athletes: revenue **+673% in year two and +255% in year three** (27x in two years), passing the previous full-year total within five months. Runs at a **71.6% operating margin** and **93.4% net revenue retention** on coaching (Aug 2026 close), with no employees.

**AI & automation infrastructure — specified, built, deployed and operated solo**

- **Self-hosted AI stack.** One Linux VPS running six Docker services (always-on LLM agent with tools and memory, n8n, Twenty CRM, Postgres, content engine, public site) behind a Tailscale private mesh with no public control plane. Guardrails designed, not defaulted; every server script version-controlled and pulled at runtime.
- **Multi-agent content pipeline.** Research, writer and translator agents on cron feed a human approval gate, then git commit, build and a live page in Spanish, English and Portuguese — measured at ~$0.20 per three-language article set.
- **LLM cost observability and model selection.** Built per-caller, token-level accounting for five services sharing one API key (prompt, output and thinking tokens stored separately); it disproved the hypothesis it was built to confirm. Migrated two of four LLM consumers to a newer model and held two back — the benchmarks measured coding, not brand-voice prose.
- **Lead-to-revenue lifecycle on owned systems.** Web and marketplace leads → n8n → self-hosted CRM → three-language nurture → onboarding. The agent turns plain-language chat updates into CRM writes; athlete intake runs Google Form → Postgres → Gemini-generated coach briefing.
- **Monthly close and analytics.** Event pipeline into BigQuery, GA4 and Search Console, reconciled into a monthly close (roster, P&L, metrics) where every figure is reproducible from a file. The first close found blended retention hiding a product line at 27%.
- **Three-language product surface.** Eleventy site with a token-gated members area, 12+ interactive training tools on two shared JavaScript engines, and a 300+ plan catalogue generated from one data file.

### Director of Operations (COO / EOS Integrator) — ClickGuard | Jan 2026 – Jul 2026

*B2B SaaS, ad fraud prevention, <$2M ARR  ·  Reported to Founder/CEO  ·  Led Sales, CS, Marketing, Product, Engineering and Data*

- Reversed a –$38K full-year 2025 EBITDA loss into **+$100K EBITDA in H1 2026** — 6x the original operating plan — while growing revenue 37.3% YoY.
- Expanded gross margin from 51.9% to 63.1% (+11.2pp) in two quarters by restructuring four of five department managers, redesigning sales commissions and driving AI-led engineering efficiency (AI-authored code from ~35% to 90%+).
- Reduced customer payback from 11 months to under 9, and repaid 50% of a $100K emergency operating loan from cash flow — the company's first debt repayment since the loan was issued in 2024.
- Built the company's first operating system: EOS (rocks, scorecard, accountability chart), monthly business reviews and weekly leadership meetings.
- Grew the agency customer base from ~50 to 92 after redesigning commissions to prioritize qualified-agency acquisition over single high-MRR accounts.
- Launched the first employee sentiment program (eNPS), lifting the score from 60 to 89 ("world-class") in one quarter with zero detractors.

### Head of Data & Analytics (previously Chief of Staff) — OneLocal | Dec 2023 – Nov 2025

*B2B SaaS, marketing services for SMBs (US/Canada)*

- Promoted from Chief of Staff to Head of Data & Analytics after building the company's first data infrastructure on GCP from the ground up.
- As Chief of Staff, acted as internal consultant to the CEO and COO, led the company-wide OKR rollout, and drove cross-functional alignment on churn reduction and LTV.
- Designed a predictive churn-score model and built an internal Gemini-powered application that analyzes meeting transcripts for customer sentiment and team-performance insight.

### Regional Operations Manager, South Cone — Binance | Jan 2023 – Dec 2023

- Owned go-to-market and growth strategy for Peru and Chile, translating market and user-behavior data into local commercial initiatives and budget allocation.

### Head of Operations (previously Manager of Operations) — FREENOW | Mar 2021 – Nov 2022

*Ride-hailing marketplace, Bogotá / Buenos Aires*

- Led Marketplace and Growth operations, managing incentive budgets across 5 cities through P&L, elasticity and competitive modeling.
- Built a data-first culture, training a 5-person operations team on SQL and BI tooling to ground every pricing and commission decision in data.
- Presented performance results and strategic plans directly to regional leadership and the board.

### Digital Accounts Value Proposition Manager, Mercado Pago — Mercado Libre | Nov 2020 – Feb 2021

- Owned value-proposition strategy for digital accounts across a four-country region (Argentina, Brazil, Mexico, Chile).

### Business Strategy & Operations Manager (Uber Eats) — Uber | Jan 2019 – Nov 2020

- Built Uber Eats' first operational dashboards and KPI tooling from scratch at regional launch, stabilizing operations across 400+ restaurant partners.
- Scaled SMB data practices to the Mid-Market & Enterprise segment, then led standardized performance dashboards across the full Uber Eats region.

## Education

**Master of Business Administration (MBA)** — IAE Business School, Universidad Austral, 2019

**Bachelor's Degree in Finance** — UADE, 2016

## Additional

**AI & automation:** Claude, Gemini API, LLM agents & multi-agent orchestration, n8n, REST APIs & webhooks, prompt and output contracts

**Data & infrastructure:** Python, SQL / Postgres, BigQuery, GCP (Cloud Run), GA4, Looker Studio, Docker, Linux, Caddy, Tailscale, Git

**Business systems:** EOS / OKRs, HubSpot CRM, Twenty CRM, Google Apps Script

**Languages:** Spanish (native), English (full professional proficiency)

**Recognition:** Winner, CFA Institute Research Challenge (Argentina & Uruguay), 2016

**Outside work:** 3x Ironman triathlon finisher; multiple sub-3-hour marathons
