# address-ml-workbench

AI-focused experiments and tooling for address intelligence, normalization, and workflow automation.

PostalBridge: https://www.postalbridge.com/

## What This Repo Shows

This repository now includes an explainable address-matching engine designed for practical AI-assisted operations work:

- feature extraction for street, unit, locality, region, and postal signals
- weighted ranking across noisy candidate records
- human-readable explanations for why a record ranked high or low
- a demo dataset and CLI for reproducible experiments

The goal is not to present a black-box model. It is to show the kind of feature engineering, ranking, and review tooling that teams use before and alongside heavier ML systems.

## Quick Start

```bash
npm install
npm test
npm run demo
```

## Repository Layout

```text
.
|-- .github/workflows/ci.yml
|-- data/demo-candidates.json
|-- package.json
|-- scripts/demo.mjs
|-- src/address-intelligence.mjs
`-- tests/address-intelligence.test.mjs
```

## Demo Output

The demo ranks candidate addresses against a set of noisy customer queries and prints:

- normalized query text
- ranked candidates
- confidence bucket
- per-feature score contributions

This makes it suitable for analyst review, QA, and tuning discussions.

## Why Explainable Ranking

Address intelligence often fails for boring reasons rather than exotic ones: abbreviated streets, misplaced unit numbers, OCR drift, or business names overwhelming the core postal features.

This workbench emphasizes:

- deterministic preprocessing
- interpretable features
- explicit weights
- reproducible outputs

That keeps it useful as both an engineering artifact and a foundation for future ML experiments.