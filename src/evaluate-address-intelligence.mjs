import { rankCandidates } from './address-intelligence.mjs';

function round(value) {
  return Math.round(value * 1000) / 1000;
}

export function evaluateCase(benchmarkCase, options = {}) {
  const matchThreshold = options.matchThreshold ?? 0.8;
  const ranked = rankCandidates(benchmarkCase.query, benchmarkCase.candidates, options.weights);
  const topResult = ranked[0] ?? null;
  const acceptableIds = benchmarkCase.acceptableIds ?? [];
  const expectedMatch = acceptableIds.length > 0;
  const predictedMatch = Boolean(topResult) && topResult.score >= matchThreshold;
  const topCandidateId = topResult?.candidate.id ?? null;
  const topIsAcceptable = Boolean(topCandidateId) && acceptableIds.includes(topCandidateId);
  const top1Correct = expectedMatch ? topIsAcceptable : !predictedMatch;
  const decisionCorrect = expectedMatch ? predictedMatch && topIsAcceptable : !predictedMatch;

  return {
    id: benchmarkCase.id,
    label: benchmarkCase.label,
    expectedMatch,
    predictedMatch,
    top1Correct,
    decisionCorrect,
    topCandidateId,
    topScore: topResult?.score ?? 0,
    topBucket: topResult?.bucket ?? 'low',
    acceptableIds,
    ranked
  };
}

export function summarizeEvaluation(results) {
  const total = results.length;
  const matchedCases = results.filter((result) => result.expectedMatch);
  const unmatchedCases = results.filter((result) => !result.expectedMatch);
  const top1Correct = matchedCases.filter((result) => result.top1Correct).length;
  const decisionCorrect = results.filter((result) => result.decisionCorrect).length;
  const falsePositives = unmatchedCases.filter((result) => result.predictedMatch).length;
  const falseNegatives = matchedCases.filter((result) => !result.predictedMatch).length;
  const averageTopScore = total > 0
    ? results.reduce((sum, result) => sum + result.topScore, 0) / total
    : 0;

  return {
    totalCases: total,
    matchedCases: matchedCases.length,
    unmatchedCases: unmatchedCases.length,
    top1Accuracy: matchedCases.length > 0 ? round(top1Correct / matchedCases.length) : 0,
    decisionAccuracy: total > 0 ? round(decisionCorrect / total) : 0,
    falsePositives,
    falseNegatives,
    averageTopScore: round(averageTopScore)
  };
}

export function evaluateBenchmark(benchmark, options = {}) {
  const cases = benchmark.cases.map((benchmarkCase) => evaluateCase(benchmarkCase, options));

  return {
    summary: summarizeEvaluation(cases),
    cases
  };
}