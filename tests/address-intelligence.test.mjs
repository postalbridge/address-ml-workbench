import test from 'node:test';
import assert from 'node:assert/strict';

import {
  bucketScore,
  explainMatch,
  DEFAULT_WEIGHTS,
  extractFeatures,
  rankCandidates,
  tokenize
} from '../src/address-intelligence.mjs';
import { evaluateBenchmark } from '../src/evaluate-address-intelligence.mjs';

const query = {
  id: 'query',
  organization: 'PostalBridge',
  recipient: 'Operations Team',
  streetAddress: '50 Harrison Street',
  addressLine2: 'Suite 412',
  locality: 'Hoboken',
  region: 'NJ',
  postalCode: '07030',
  country: 'US'
};

const exactish = {
  id: 'exact',
  organization: 'postalbridge',
  recipient: 'ops team',
  streetAddress: '50 Harrison St',
  addressLine2: 'Ste 412',
  locality: 'Hoboken',
  region: 'NJ',
  postalCode: '07030',
  country: 'US'
};

const weaker = {
  id: 'weaker',
  organization: 'postalbridge',
  recipient: 'operations team',
  streetAddress: '50 Harrison Street',
  addressLine2: 'Suite 210',
  locality: 'Jersey City',
  region: 'NJ',
  postalCode: '07302',
  country: 'US'
};

test('tokenize normalizes street synonyms', () => {
  assert.deepEqual(tokenize('123 Main Street Apt 4'), ['123', 'main', 'st', 'apt', '4']);
});

test('tokenize normalizes operational abbreviations', () => {
  assert.deepEqual(tokenize('Ops Team'), ['operations', 'team']);
});

test('extractFeatures captures exact postal and locality matches', () => {
  const features = extractFeatures(query, exactish);

  assert.equal(features.houseNumberMatch, 1);
  assert.equal(features.postalCodeMatch, 1);
  assert.equal(features.localityMatch, 1);
  assert.equal(features.regionMatch, 1);
});

test('rankCandidates prefers the better record', () => {
  const ranked = rankCandidates(query, [weaker, exactish]);

  assert.equal(ranked[0].candidate.id, 'exact');
  assert.ok(ranked[0].score > ranked[1].score);
  assert.equal(ranked[0].features.unitMatch, 1);
  assert.equal(ranked[1].features.unitMatch, 0);
});

test('explainMatch returns a reviewable summary', () => {
  const explanation = explainMatch(query, exactish);

  assert.equal(explanation.bucket, 'high');
  assert.ok(explanation.summary.includes('houseNumberMatch=1'));
  assert.ok(explanation.summary.includes('postalCodeMatch=1'));
});

test('bucketScore separates low and review matches', () => {
  assert.equal(bucketScore(0.91), 'high');
  assert.equal(bucketScore(0.65), 'review');
  assert.equal(bucketScore(0.42), 'low');
});

test('evaluateBenchmark reports perfect performance on a deterministic mini benchmark', () => {
  const benchmark = {
    cases: [
      {
        id: 'known-match',
        label: 'Known match',
        acceptableIds: ['exact'],
        query,
        candidates: [weaker, exactish]
      },
      {
        id: 'known-non-match',
        label: 'Known non-match',
        acceptableIds: [],
        query: {
          id: 'no-match',
          organization: 'Aurora Ops',
          recipient: 'Riley Chen',
          streetAddress: '900 Pine Street',
          addressLine2: 'Suite 880',
          locality: 'Seattle',
          region: 'WA',
          postalCode: '98101',
          country: 'US'
        },
        candidates: [
          {
            id: 'portland',
            organization: 'aurora ops',
            recipient: 'riley chen',
            streetAddress: '915 Pine St',
            addressLine2: 'Suite 880',
            locality: 'Portland',
            region: 'OR',
            postalCode: '97205',
            country: 'US'
          }
        ]
      }
    ]
  };

  const result = evaluateBenchmark(benchmark, {
    matchThreshold: 0.8,
    weights: DEFAULT_WEIGHTS
  });

  assert.equal(result.summary.totalCases, 2);
  assert.equal(result.summary.top1Accuracy, 1);
  assert.equal(result.summary.decisionAccuracy, 1);
  assert.equal(result.summary.falsePositives, 0);
  assert.equal(result.summary.falseNegatives, 0);
});