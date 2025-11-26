import { serve } from 'bun';

// Test the signup endpoint
const testSignup = async () => {
  const apiUrl = process.env.API_URL || 'https://localhost:8080';
  
  const response = await fetch(`${apiUrl}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    }),
  });

  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', data);
};

// Wait a bit for server to start, then test
setTimeout(testSignup, 1000);
