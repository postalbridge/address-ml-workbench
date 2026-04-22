import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { rankCandidates } from '../src/address-intelligence.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const datasetPath = path.resolve(__dirname, '..', 'data', 'demo-candidates.json');

function renderAddress(record) {
  return [
    record.organization,
    record.recipient,
    record.streetAddress,
    record.addressLine2,
    `${record.locality}, ${record.region} ${record.postalCode}`,
    record.country
  ]
    .filter(Boolean)
    .join(' | ');
}

async function main() {
  const content = await readFile(datasetPath, 'utf8');
  const dataset = JSON.parse(content);

  for (const query of dataset.queries) {
    const ranked = rankCandidates(query, dataset.candidates).slice(0, 3);

    console.log(`\nQuery: ${query.id}`);
    console.log(renderAddress(query));

    ranked.forEach((result, index) => {
      console.log(
        [
          `  ${index + 1}. ${result.candidate.id} score=${result.score} bucket=${result.bucket}`,
          `     ${renderAddress(result.candidate)}`,
          `     ${result.summary}`
        ].join('\n')
      );
    });
  }
}

await main();