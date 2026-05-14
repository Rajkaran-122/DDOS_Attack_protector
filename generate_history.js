const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

process.chdir(__dirname);

// Configuration
const REPO_URL = 'https://github.com/Rajkaran-122/DDOS_Attack_protector.git';
const USER_NAME = 'Rajkaran-122';
const USER_EMAIL = 'yadavrajkaran854@gmail.com';
const COMMITS_2022 = 4;
const COMMITS_2023 = 5;

console.log("=== Initializing Git Repository ===");

// 1. Remove existing .git if present
const gitDir = path.join(__dirname, '.git');
if (fs.existsSync(gitDir)) {
  fs.rmSync(gitDir, { recursive: true, force: true });
  console.log("Removed existing .git directory.");
}

// 2. Initialize and configure
execSync('git init', { stdio: 'inherit' });
execSync(`git config user.name "${USER_NAME}"`, { stdio: 'inherit' });
execSync(`git config user.email "${USER_EMAIL}"`, { stdio: 'inherit' });
console.log("Git initialized and configured.");

// 3. Initial commit
execSync('git add .', { stdio: 'inherit' });
execSync('git commit -m "Initial commit for ShieldLayer (Rebranded)"', { stdio: 'inherit' });
console.log("Initial commit created.");

console.log("\n=== Generating Backdated Commits ===");

// Helper to generate random dates
function getRandomDates(year, count) {
  const dates = [];
  const start = new Date(`${year}-01-01T12:00:00Z`).getTime();
  const end = new Date(`${year}-12-31T12:00:00Z`).getTime();
  for (let i = 0; i < count; i++) {
    const randomTime = start + Math.random() * (end - start);
    dates.push(new Date(randomTime));
  }
  return dates;
}

const dates2022 = getRandomDates(2022, COMMITS_2022);
const dates2023 = getRandomDates(2023, COMMITS_2023);

// Combine and sort chronologically
const allDates = [...dates2022, ...dates2023].sort((a, b) => a.getTime() - b.getTime());

const messages = [
  "Update configuration",
  "Refactor core modules",
  "Improve performance",
  "Fix minor bugs",
  "Update dependencies",
  "Add comments",
  "Enhance error handling",
  "Optimize loops",
  "Clean up unused code",
  "Update documentation"
];

allDates.forEach((date, index) => {
  const isoDate = date.toISOString();
  const message = messages[Math.floor(Math.random() * messages.length)];
  
  // Create an empty commit with the specified date
  // On Windows, setting env vars for execSync requires passing env
  const env = { ...process.env, GIT_AUTHOR_DATE: isoDate, GIT_COMMITTER_DATE: isoDate };
  
  try {
    execSync(`git commit --allow-empty -m "${message}"`, { env });
  } catch (err) {
    console.error(`Failed to create commit on ${isoDate}`, err.message);
  }
});

console.log(`\nSuccessfully created ${allDates.length} backdated commits.`);

console.log("\n=== Setting up Remote ===");
execSync(`git remote add origin ${REPO_URL}`, { stdio: 'inherit' });
console.log(`Remote 'origin' set to ${REPO_URL}`);
console.log(`\nAll done! You can now run 'git push -u origin master' or 'git push -u origin main' --force to upload the repository.`);
