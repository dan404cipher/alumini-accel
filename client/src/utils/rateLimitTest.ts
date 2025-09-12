// Utility to test rate limiting functionality
import { authAPI } from "@/lib/api";

export const testRateLimit = async () => {
  console.log("Testing rate limiting...");

  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      authAPI
        .login({ email: "test@example.com", password: "wrongpassword" })
        .then((response) => ({ success: true, response }))
        .catch((error) => ({ success: false, error: error.message }))
    );
  }

  const results = await Promise.all(promises);
  console.log("Rate limit test results:", results);

  return results;
};
