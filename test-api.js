/**
 * Bakery by the Bay — Comprehensive API Test Suite
 * Tests all 4 backend endpoints sequentially.
 *
 * Usage: node test-api.js
 * Requires: server.js running on localhost:3000
 */
const fetch = require('node-fetch');
require('dotenv').config();

const BASE = 'http://localhost:3000';
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

// ============================================================
// Test 1: GET /api/health
// ============================================================
async function testHealth() {
  const res = await fetch(`${BASE}/api/health`);
  assert(res.ok, `Status ${res.status}`);
  const body = await res.json();
  assert(body.status === 'ok', `Expected status "ok", got "${body.status}"`);
  assert(body.timestamp, 'Missing timestamp');
}

// ============================================================
// Test 2: POST /api/scan-menu — missing image (400)
// ============================================================
async function testScanMenuMissingImage() {
  const res = await fetch(`${BASE}/api/scan-menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  const body = await res.json();
  assert(body.error === 'No image provided', `Unexpected error: ${body.error}`);
}

// ============================================================
// Test 3: POST /api/scan-menu — invalid image (should try models)
// ============================================================
async function testScanMenuInvalidImage() {
  const res = await fetch(`${BASE}/api/scan-menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // A tiny 1x1 black PNG (not a menu photo)
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    })
  });

  // This could succeed (if the vision model "sees" something) or fail with 500
  // Either is acceptable behaviour — we just verify the response shape
  const body = await res.json();

  if (res.ok) {
    assert(Array.isArray(body), 'Expected array response');
    console.log(`     (OCR returned ${body.length} items — unusual for a 1x1 pixel, but model-dependent)`);
  } else {
    assert(body.error, 'Expected error message');
    console.log(`     (OCR properly rejected non-menu image: ${body.error})`);
  }
}

// ============================================================
// Test 4: POST /api/publish-menu — missing fields (400)
// ============================================================
async function testPublishMenuMissingFields() {
  const res = await fetch(`${BASE}/api/publish-menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ menuId: 'test' }) // missing date + items
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  const body = await res.json();
  assert(body.error === 'Missing required fields', `Unexpected: ${body.error}`);
}

// ============================================================
// Test 5: POST /api/publish-menu — happy path
// ============================================================
async function testPublishMenuSuccess() {
  const testDate = new Date().toISOString().split('T')[0];
  const menuItems = [
    { name: 'Croissant', price: 3.50, category: 'Pastry', available: true },
    { name: 'Sourdough Loaf', price: 5.00, category: 'Bread', available: true },
    { name: 'Latte', price: 4.00, category: 'Coffee', available: true }
  ];

  // Note: no menuId sent — the server auto-generates or finds menu by date
  const res = await fetch(`${BASE}/api/publish-menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: testDate,
      items: menuItems
    })
  });

  assert(res.ok, `Status ${res.status}`);
  const body = await res.json();
  assert(body.success === true, `Expected success, got ${JSON.stringify(body)}`);
}

// ============================================================
// Test 6: POST /api/update-order-status — missing fields (400)
// ============================================================
async function testUpdateOrderMissingFields() {
  const res = await fetch(`${BASE}/api/update-order-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId: 'BKR-2205-TEST' }) // missing status
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  const body = await res.json();
  assert(body.error === 'Missing bookingId or status', `Unexpected: ${body.error}`);
}

// ============================================================
// Test 7: POST /api/update-order-status — invalid status (400)
// ============================================================
async function testUpdateOrderInvalidStatus() {
  const res = await fetch(`${BASE}/api/update-order-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId: 'BKR-2205-TEST', status: 'invalid' })
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  const body = await res.json();
  assert(body.error === 'Invalid status', `Unexpected: ${body.error}`);
}

// ============================================================
// Test 8: POST /api/update-order-status — non-existent booking (should be a no-op)
// ============================================================
async function testUpdateOrderNonExistent() {
  const res = await fetch(`${BASE}/api/update-order-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId: 'BKR-NONEXIST', status: 'ready' })
  });
  // Even for non-existent booking, the supabase update will succeed (just affects 0 rows)
  assert(res.ok, `Expected 200, got ${res.status}`);
  const body = await res.json();
  assert(body.success === true, `Expected success, got ${JSON.stringify(body)}`);
}

// ============================================================
// Test 9: 404 on unknown endpoint
// ============================================================
async function testUnknownEndpoint() {
  const res = await fetch(`${BASE}/api/nonexistent`);
  assert(res.status === 404, `Expected 404, got ${res.status}`);
}

// ============================================================
// Test 10: Static file serving (root page)
// ============================================================
async function testStaticFileServing() {
  const res = await fetch(`${BASE}/`);
  assert(res.ok, `Status ${res.status}`);
  const text = await res.text();
  assert(text.includes('<!DOCTYPE html>') || text.includes('<html'), 'Expected HTML response');
}

// ============================================================
// Run All Tests
// ============================================================
async function runAll() {
  console.log('\n  🥐 Bakery by the Bay — API Test Suite\n');
  console.log(`  Server: ${BASE}\n`);

  // --- GET /api/health ---
  console.log('📡 GET /api/health');
  await test('Returns { status: "ok" } with timestamp', testHealth);

  // --- POST /api/scan-menu ---
  console.log('\n📸 POST /api/scan-menu');
  await test('Rejects missing image (400)', testScanMenuMissingImage);
  await test('Handles invalid/non-menu image gracefully', testScanMenuInvalidImage);

  // --- POST /api/publish-menu ---
  console.log('\n📝 POST /api/publish-menu');
  await test('Rejects missing fields (400)', testPublishMenuMissingFields);
  await test('Publishes menu items successfully', testPublishMenuSuccess);

  // --- POST /api/update-order-status ---
  console.log('\n🔄 POST /api/update-order-status');
  await test('Rejects missing fields (400)', testUpdateOrderMissingFields);
  await test('Rejects invalid status (400)', testUpdateOrderInvalidStatus);
  await test('Handles non-existent booking gracefully', testUpdateOrderNonExistent);

  // --- Misc ---
  console.log('\n🔍 Misc');
  await test('Returns 404 for unknown endpoints', testUnknownEndpoint);
  await test('Serves static files (root page)', testStaticFileServing);

  // --- Summary ---
  const total = passed + failed;
  console.log('\n' + '='.repeat(50));
  console.log(`  Results: ${passed}/${total} passed`);
  if (failed > 0) {
    console.log(`  ${failed} test(s) FAILED`);
    process.exit(1);
  } else {
    console.log('  All tests passed! 🎉');
  }
  console.log('='.repeat(50) + '\n');
}

runAll().catch(err => {
  console.error('\n  ❌ Fatal error:', err.message);
  process.exit(1);
});
