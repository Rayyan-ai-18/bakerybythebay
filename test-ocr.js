const fetch = require('node-fetch');
const fs = require('fs');
require('dotenv').config();

// Create a simple test image (we'll use a small base64 encoded image for testing)
// This is a 1x1 pixel black PNG
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function testOCR() {
  console.log('Testing OCR functionality with sample image...');

  try {
    const response = await fetch('http://localhost:3000/api/scan-menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64: testImageBase64
      })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ OCR test successful!');
    } else {
      console.log('❌ OCR test failed');
    }
  } catch (error) {
    console.error('Error during OCR test:', error.message);
  }
}

testOCR();