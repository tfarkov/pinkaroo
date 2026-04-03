import { assertMockDataIntegrity, MOCK_LISTINGS } from '../lib/mockData';

function main() {
  assertMockDataIntegrity();
  console.log(`Mock data validation passed for ${MOCK_LISTINGS.length} listings.`);
}

main();
