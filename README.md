# address-ml-workbench

AI-focused experiments and tooling for address intelligence, normalization, and workflow automation.

PostalBridge: https://www.postalbridge.com/

## What This Repo Shows

This repository now includes an explainable address-matching engine designed for practical AI-assisted operations work:

- feature extraction for street, unit, locality, region, and postal signals
- weighted ranking across noisy candidate records
- human-readable explanations for why a record ranked high or low
- a demo dataset and CLI for reproducible experiments
- a benchmark evaluator with measurable top-1 and threshold-based quality metrics

The goal is not to present a black-box model. It is to show the kind of feature engineering, ranking, and review tooling that teams use before and alongside heavier ML systems.

## Quick Start

```bash
npm install
npm test
npm run demo
npm run evaluate
```

## Repository Layout

```text
.
|-- .github/workflows/ci.yml
|-- data/demo-candidates.json
|-- data/evaluation-benchmark.json
|-- package.json
|-- scripts/demo.mjs
|-- scripts/evaluate.mjs
|-- src/address-intelligence.mjs
|-- src/evaluate-address-intelligence.mjs
`-- tests/address-intelligence.test.mjs
```

## Demo Output

The demo ranks candidate addresses against a set of noisy customer queries and prints:

- normalized query text
- ranked candidates
- confidence bucket
- per-feature score contributions

This makes it suitable for analyst review, QA, and tuning discussions.

## Evaluation

The evaluation pipeline runs deterministic benchmark cases and reports:

- top-1 accuracy on known-match cases
- threshold decision accuracy across match and no-match cases
- false-positive and false-negative counts
- average top score

That gives the repo a credible measurement story instead of just a ranked demo.

## Why Explainable Ranking

Address intelligence often fails for boring reasons rather than exotic ones: abbreviated streets, misplaced unit numbers, OCR drift, or business names overwhelming the core postal features.

This workbench emphasizes:

- deterministic preprocessing
- interpretable features
- explicit weights
- reproducible outputs

That keeps it useful as both an engineering artifact and a foundation for future ML experiments.