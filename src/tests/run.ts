import { runEditorTests } from './editor.test';

console.log('--- RUNNING ZYVOX AI STUDIO CORE TESTS ---');
const results = runEditorTests();
let allPassed = true;

results.forEach((r) => {
  const symbol = r.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${symbol}: ${r.test}`);
  if (r.message) console.log(`   Details: ${r.message}`);
  if (!r.passed) allPassed = false;
});

if (allPassed) {
  console.log('\n🌟 ALL 4 CORE TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  console.error('\n⚠️ SOME TESTS FAILED');
  process.exit(1);
}
