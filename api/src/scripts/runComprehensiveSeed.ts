#!/usr/bin/env ts-node

import comprehensiveSeed from "./comprehensiveSeed";

// Run the comprehensive seed
comprehensiveSeed().catch((error) => {
  console.error("Failed to run comprehensive seed:", error);
  process.exit(1);
});
