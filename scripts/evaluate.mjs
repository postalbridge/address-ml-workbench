import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { evaluateBenchmark } from '../src/evaluate-address-intelligence.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const datasetPath = path.resolve(__dirname, '..', 'data', 'evaluation-benchmark.json');

async function main() {
  const content = await readFile(datasetPath, 'utf8');
  const benchmark = JSON.parse(content);
  const result = evaluateBenchmark(benchmark, { matchThreshold: benchmark.matchThreshold });

  console.log('Evaluation Summary');
  console.log(JSON.stringify(result.summary, null, 2));

  for (const benchmarkCase of result.cases) {
    console.log(`\nCase: ${benchmarkCase.id}`);
    console.log(`  label: ${benchmarkCase.label}`);
    console.log(`  predicted: ${benchmarkCase.predictedMatch} top=${benchmarkCase.topCandidateId} score=${benchmarkCase.topScore}`);
    console.log(`  top1Correct: ${benchmarkCase.top1Correct} decisionCorrect: ${benchmarkCase.decisionCorrect}`);
  }
}

await main();