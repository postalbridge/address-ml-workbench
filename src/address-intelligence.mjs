const STREET_SYNONYMS = new Map([
  ['street', 'st'],
  ['st.', 'st'],
  ['avenue', 'ave'],
  ['ave.', 'ave'],
  ['road', 'rd'],
  ['rd.', 'rd'],
  ['boulevard', 'blvd'],
  ['drive', 'dr'],
  ['lane', 'ln'],
  ['court', 'ct'],
  ['suite', 'ste'],
  ['apartment', 'apt'],
  ['unit', 'unit'],
  ['ops', 'operations'],
  ['floor', 'fl'],
  ['building', 'bldg']
]);

function cleanText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .toLowerCase()
    .replace(/[^a-z0-9#\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeToken(token) {
  return STREET_SYNONYMS.get(token) ?? token;
}

export function tokenize(value) {
  return cleanText(value)
    .split(' ')
    .map((token) => normalizeToken(token))
    .filter(Boolean);
}

function tokenSet(value) {
  return new Set(tokenize(value));
}

function jaccard(left, right) {
  if (left.size === 0 && right.size === 0) {
    return 1;
  }

  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : intersection / union;
}

function digits(value) {
  return cleanText(value).match(/\d+/g) ?? [];
}

function firstHouseNumber(value) {
  return digits(value)[0] ?? null;
}

function extractUnit(value) {
  const text = cleanText(value)
    .replace(/\bsuite\b/g, 'ste')
    .replace(/\bapartment\b/g, 'apt');
  const match = text.match(/(?:apt|ste|unit|#)\s*([a-z0-9-]+)/);
  return match?.[1] ?? null;
}

function charBigrams(value) {
  const text = cleanText(value).replace(/\s+/g, '');
  if (text.length < 2) {
    return new Set(text ? [text] : []);
  }

  const grams = new Set();
  for (let index = 0; index < text.length - 1; index += 1) {
    grams.add(text.slice(index, index + 2));
  }
  return grams;
}

function normalizePostal(value) {
  return cleanText(value).replace(/\s+/g, '').toUpperCase();
}

function normalizeRegion(value) {
  return cleanText(value).toUpperCase();
}

function combineAddress(record) {
  return [
    record.organization,
    record.recipient,
    record.streetAddress,
    record.addressLine2,
    record.locality,
    record.region,
    record.postalCode,
    record.country
  ]
    .filter(Boolean)
    .join(' ');
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

export function normalizeRecord(record) {
  return {
    id: record.id,
    organization: cleanText(record.organization),
    recipient: cleanText(record.recipient),
    streetAddress: cleanText(record.streetAddress),
    addressLine2: cleanText(record.addressLine2),
    locality: cleanText(record.locality),
    region: normalizeRegion(record.region),
    postalCode: normalizePostal(record.postalCode),
    country: cleanText(record.country),
    raw: record
  };
}

export function extractFeatures(queryRecord, candidateRecord) {
  const query = normalizeRecord(queryRecord);
  const candidate = normalizeRecord(candidateRecord);

  const queryStreetTokens = tokenSet(query.streetAddress);
  const candidateStreetTokens = tokenSet(candidate.streetAddress);
  const queryNameTokens = tokenSet([query.organization, query.recipient].filter(Boolean).join(' '));
  const candidateNameTokens = tokenSet([candidate.organization, candidate.recipient].filter(Boolean).join(' '));

  const features = {
    streetTokenSimilarity: jaccard(queryStreetTokens, candidateStreetTokens),
    fullTextSimilarity: jaccard(tokenSet(combineAddress(query)), tokenSet(combineAddress(candidate))),
    nameSimilarity: jaccard(queryNameTokens, candidateNameTokens),
    streetBigramSimilarity: jaccard(charBigrams(query.streetAddress), charBigrams(candidate.streetAddress)),
    houseNumberMatch: Number(firstHouseNumber(query.streetAddress) === firstHouseNumber(candidate.streetAddress)),
    postalCodeMatch: Number(query.postalCode && candidate.postalCode && query.postalCode === candidate.postalCode),
    localityMatch: Number(query.locality && candidate.locality && query.locality === candidate.locality),
    regionMatch: Number(query.region && candidate.region && query.region === candidate.region),
    unitMatch: Number(extractUnit(query.addressLine2 || query.streetAddress) === extractUnit(candidate.addressLine2 || candidate.streetAddress)),
    organizationHint: Number(Boolean(query.organization) && query.organization === candidate.organization)
  };

  return Object.fromEntries(Object.entries(features).map(([key, value]) => [key, round(value)]));
}

export const DEFAULT_WEIGHTS = {
  streetTokenSimilarity: 0.23,
  fullTextSimilarity: 0.12,
  nameSimilarity: 0.08,
  streetBigramSimilarity: 0.09,
  houseNumberMatch: 0.17,
  postalCodeMatch: 0.14,
  localityMatch: 0.06,
  regionMatch: 0.04,
  unitMatch: 0.04,
  organizationHint: 0.03
};

export function scoreFeatures(features, weights = DEFAULT_WEIGHTS) {
  const contributions = Object.entries(weights).map(([featureName, weight]) => {
    const value = features[featureName] ?? 0;
    return {
      feature: featureName,
      weight,
      value,
      contribution: round(value * weight)
    };
  });

  const score = round(contributions.reduce((sum, item) => sum + item.contribution, 0));
  return { score, contributions };
}

export function bucketScore(score) {
  if (score >= 0.82) {
    return 'high';
  }

  if (score >= 0.62) {
    return 'review';
  }

  return 'low';
}

export function explainMatch(queryRecord, candidateRecord, weights = DEFAULT_WEIGHTS) {
  const features = extractFeatures(queryRecord, candidateRecord);
  const { score, contributions } = scoreFeatures(features, weights);

  const topSignals = contributions
    .filter((item) => item.value > 0)
    .sort((left, right) => right.contribution - left.contribution)
    .slice(0, 4)
    .map((item) => `${item.feature}=${item.value}`);

  return {
    score,
    bucket: bucketScore(score),
    features,
    contributions,
    summary: topSignals.join(', ')
  };
}

export function rankCandidates(queryRecord, candidates, weights = DEFAULT_WEIGHTS) {
  return candidates
    .map((candidate) => ({
      candidate,
      ...explainMatch(queryRecord, candidate, weights)
    }))
    .sort((left, right) => right.score - left.score);
}