#!/usr/bin/env node

/**
 * Security Check Script - GPT-5 Nano Extension
 * Scans codebase for hardcoded API keys and sensitive information
 */

const fs = require('fs');
const path = require('path');

// Patterns to detect hardcoded API keys and secrets
const SECURITY_PATTERNS = [
  {
    name: 'OpenAI API Key',
    pattern: /sk-[a-zA-Z0-9]{48,}/g,
    severity: 'CRITICAL'
  },
  {
    name: 'OpenAI Project Key',
    pattern: /sk-proj-[a-zA-Z0-9_-]{100,}/g,
    severity: 'CRITICAL'
  },
  {
    name: 'Generic API Key',
    pattern: /api[_-]?key["\s]*[:=]["\s]*[a-zA-Z0-9]{20,}/gi,
    severity: 'HIGH'
  },
  {
    name: 'Authorization Token',
    pattern: /bearer\s+[a-zA-Z0-9]{20,}/gi,
    severity: 'HIGH'
  },
  {
    name: 'Secret Key',
    pattern: /secret[_-]?key["\s]*[:=]["\s]*[a-zA-Z0-9]{16,}/gi,
    severity: 'HIGH'
  },
  {
    name: 'Password',
    pattern: /password["\s]*[:=]["\s]*[^"\s]{8,}/gi,
    severity: 'MEDIUM'
  }
];

// Files to scan
const FILES_TO_SCAN = [
  'background.js',
  'content.js',
  'popup.js',
  'manifest.json',
  'landing-page/auth.js',
  'landing-page/script.js'
];

// Files to exclude from scanning
const EXCLUDE_PATTERNS = [
  /\.backup$/,
  /\.example$/,
  /debug.*\.js$/,
  /test.*\.js$/,
  /security-check\.js$/
];

function scanFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    SECURITY_PATTERNS.forEach(({ name, pattern, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Skip if it's a placeholder or example
          if (match.includes('YOUR_API_KEY_HERE') || 
              match.includes('sk-YOUR_API_KEY_HERE') ||
              match.includes('PLACEHOLDER') ||
              match.includes('example')) {
            return;
          }

          issues.push({
            file: filePath,
            pattern: name,
            severity,
            match: match.substring(0, 50) + '...',
            line: findLineNumber(content, match)
          });
        });
      }
    });

    return issues;
  } catch (error) {
    console.error(`❌ Error scanning ${filePath}:`, error.message);
    return [];
  }
}

function findLineNumber(content, searchText) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchText.substring(0, 20))) {
      return i + 1;
    }
  }
  return 'Unknown';
}

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function runSecurityScan() {
  console.log('🔒 GPT-5 Nano Extension Security Scan');
  console.log('=====================================\n');

  let totalIssues = 0;
  let criticalIssues = 0;

  FILES_TO_SCAN.forEach(file => {
    if (shouldExclude(file)) {
      console.log(`⏭️  Skipping excluded file: ${file}`);
      return;
    }

    console.log(`🔍 Scanning: ${file}`);
    const issues = scanFile(file);

    if (issues.length === 0) {
      console.log(`✅ Clean - No security issues found\n`);
    } else {
      console.log(`❌ Found ${issues.length} issue(s):`);
      issues.forEach(issue => {
        console.log(`   ${issue.severity}: ${issue.pattern}`);
        console.log(`   Line ${issue.line}: ${issue.match}`);
        console.log('');
        
        totalIssues++;
        if (issue.severity === 'CRITICAL') {
          criticalIssues++;
        }
      });
    }
  });

  // Summary
  console.log('\n📊 Security Scan Summary');
  console.log('========================');
  console.log(`Total issues found: ${totalIssues}`);
  console.log(`Critical issues: ${criticalIssues}`);

  if (criticalIssues > 0) {
    console.log('\n🚨 CRITICAL SECURITY ISSUES DETECTED!');
    console.log('Please remove all hardcoded API keys before deployment.');
    process.exit(1);
  } else if (totalIssues > 0) {
    console.log('\n⚠️  Some security issues detected. Please review.');
    process.exit(1);
  } else {
    console.log('\n✅ Security scan passed! No issues detected.');
    console.log('💡 The extension is ready for secure deployment.');
    process.exit(0);
  }
}

// Check for environment variables
function checkEnvironmentSetup() {
  console.log('🌍 Environment Configuration Check');
  console.log('==================================\n');

  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  
  if (fs.existsSync(backendEnvPath)) {
    console.log('✅ Backend .env file found');
    
    const envContent = fs.readFileSync(backendEnvPath, 'utf8');
    const requiredVars = [
      'OPENAI_API_KEY',
      'JWT_SECRET',
      'MONGODB_URI',
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET'
    ];

    let missingVars = [];
    requiredVars.forEach(varName => {
      if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=PLACEHOLDER`)) {
        missingVars.push(varName);
      }
    });

    if (missingVars.length === 0) {
      console.log('✅ All required environment variables are configured');
    } else {
      console.log('⚠️  Missing environment variables:');
      missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
      });
    }
  } else {
    console.log('❌ Backend .env file not found');
    console.log('💡 Run: cp backend/.env.example backend/.env');
  }

  console.log('');
}

// Main execution
if (require.main === module) {
  checkEnvironmentSetup();
  runSecurityScan();
}

module.exports = { scanFile, runSecurityScan };
