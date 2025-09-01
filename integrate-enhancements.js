#!/usr/bin/env node

/**
 * Integration Script for YouTube Summarizer Enhancements
 * This script integrates all the beautiful UI enhancements into the main files
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting YouTube Summarizer Enhancement Integration...\n');

// File paths
const paths = {
  contentJs: './content.js',
  stylesExactCss: './styles-exact.css',
  beautifulUiJs: './beautiful-ui-enhancement.js',
  beautifulUiCss: './beautiful-ui-styles.css',
  contentLoadingJs: './content-loading-update.js',
  enhancedStylesCss: './enhanced-styles-append.css'
};

// Check if all files exist
function checkFiles() {
  console.log('📋 Checking required files...');
  
  const requiredFiles = [
    paths.contentJs,
    paths.stylesExactCss,
    paths.beautifulUiJs,
    paths.beautifulUiCss
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.error('❌ Missing required files:');
    missingFiles.forEach(file => console.error(`   - ${file}`));
    process.exit(1);
  }
  
  console.log('✅ All required files found!\n');
}

// Backup original files
function backupFiles() {
  console.log('💾 Creating backups of original files...');
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  
  // Backup content.js
  if (fs.existsSync(paths.contentJs)) {
    fs.copyFileSync(paths.contentJs, `content.js.backup.${timestamp}`);
    console.log('✅ Backed up content.js');
  }
  
  // Backup styles-exact.css
  if (fs.existsSync(paths.stylesExactCss)) {
    fs.copyFileSync(paths.stylesExactCss, `styles-exact.css.backup.${timestamp}`);
    console.log('✅ Backed up styles-exact.css');
  }
  
  console.log(`📁 Backup files created with timestamp: ${timestamp}\n`);
}

// Integrate beautiful UI into content.js
function integrateContentJs() {
  console.log('🎨 Integrating beautiful UI into content.js...');
  
  try {
    // Read existing content.js
    const contentJs = fs.readFileSync(paths.contentJs, 'utf8');
    
    // Read beautiful UI enhancement
    const beautifulUiJs = fs.readFileSync(paths.beautifulUiJs, 'utf8');
    
    // Read enhanced loading functions
    let contentLoadingJs = '';
    if (fs.existsSync(paths.contentLoadingJs)) {
      contentLoadingJs = fs.readFileSync(paths.contentLoadingJs, 'utf8');
    }
    
    // Extract the new createSummaryContainer function
    const createSummaryMatch = beautifulUiJs.match(/createSummaryContainer\(\)\s*{[\s\S]*?^}/m);
    const newCreateSummaryContainer = createSummaryMatch ? createSummaryMatch[0] : '';
    
    if (!newCreateSummaryContainer) {
      console.error('❌ Could not extract createSummaryContainer function from beautiful-ui-enhancement.js');
      return false;
    }
    
    // Replace the existing createSummaryContainer function
    const updatedContentJs = contentJs.replace(
      /createSummaryContainer\(\)\s*{[\s\S]*?^  }/m,
      newCreateSummaryContainer
    );
    
    // Add enhanced loading functions if available
    let finalContentJs = updatedContentJs;
    if (contentLoadingJs) {
      // Extract enhanced functions and add them
      const enhancedFunctions = [
        'showEnhancedLoadingState',
        'animateLoadingSteps',
        'generateSummaryIfNeeded',
        'getSummaryByTypeWithProgress',
        'showErrorState',
        'capitalizeFirst'
      ];
      
      enhancedFunctions.forEach(funcName => {
        const funcMatch = contentLoadingJs.match(new RegExp(`${funcName}\\([^)]*\\)\\s*{[\\s\\S]*?^}`, 'm'));
        if (funcMatch) {
          finalContentJs += `\n\n  // Enhanced function: ${funcName}\n  ${funcMatch[0]}`;
        }
      });
    }
    
    // Write the updated content.js
    fs.writeFileSync(paths.contentJs, finalContentJs);
    console.log('✅ Successfully integrated beautiful UI into content.js');
    return true;
    
  } catch (error) {
    console.error('❌ Error integrating content.js:', error.message);
    return false;
  }
}

// Integrate beautiful styles into styles-exact.css
function integrateStylesCss() {
  console.log('🎨 Integrating beautiful styles into styles-exact.css...');
  
  try {
    // Read beautiful UI styles
    const beautifulUiCss = fs.readFileSync(paths.beautifulUiCss, 'utf8');
    
    // Read enhanced styles if available
    let enhancedStylesCss = '';
    if (fs.existsSync(paths.enhancedStylesCss)) {
      enhancedStylesCss = fs.readFileSync(paths.enhancedStylesCss, 'utf8');
    }
    
    // Combine all styles
    let finalCss = `/* YouTube Summarizer - Beautiful UI Enhanced */\n\n`;
    finalCss += beautifulUiCss;
    
    if (enhancedStylesCss) {
      finalCss += '\n\n/* Enhanced Loading Styles */\n';
      finalCss += enhancedStylesCss;
    }
    
    // Write the updated styles-exact.css
    fs.writeFileSync(paths.stylesExactCss, finalCss);
    console.log('✅ Successfully integrated beautiful styles into styles-exact.css');
    return true;
    
  } catch (error) {
    console.error('❌ Error integrating styles-exact.css:', error.message);
    return false;
  }
}

// Clean up temporary files
function cleanup() {
  console.log('🧹 Cleaning up temporary files...');
  
  const tempFiles = [
    paths.beautifulUiJs,
    paths.beautifulUiCss,
    paths.contentLoadingJs,
    paths.enhancedStylesCss,
    './loading-enhancements.css',
    './enhanced-content-loading.js'
  ];
  
  tempFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        console.log(`✅ Removed ${file}`);
      } catch (error) {
        console.log(`⚠️  Could not remove ${file}: ${error.message}`);
      }
    }
  });
}

// Validate integration
function validateIntegration() {
  console.log('🔍 Validating integration...');
  
  // Check if content.js contains beautiful UI elements
  const contentJs = fs.readFileSync(paths.contentJs, 'utf8');
  const hasBeautifulUI = contentJs.includes('summarizer-card') && 
                         contentJs.includes('beautiful-select') &&
                         contentJs.includes('action-button');
  
  // Check if styles contain beautiful elements
  const stylesCss = fs.readFileSync(paths.stylesExactCss, 'utf8');
  const hasBeautifulStyles = stylesCss.includes('linear-gradient') &&
                             stylesCss.includes('beautiful-select') &&
                             stylesCss.includes('action-button');
  
  if (hasBeautifulUI && hasBeautifulStyles) {
    console.log('✅ Integration validation successful!');
    return true;
  } else {
    console.error('❌ Integration validation failed!');
    console.error(`   Beautiful UI in content.js: ${hasBeautifulUI}`);
    console.error(`   Beautiful styles in CSS: ${hasBeautifulStyles}`);
    return false;
  }
}

// Show final instructions
function showFinalInstructions() {
  console.log('\n🎉 INTEGRATION COMPLETE!\n');
  
  console.log('📋 Next Steps:');
  console.log('1. Open Chrome and go to chrome://extensions/');
  console.log('2. Enable "Developer mode" (toggle in top right)');
  console.log('3. Click "Load unpacked" and select this folder');
  console.log('4. Go to any YouTube video to test your beautiful extension!');
  
  console.log('\n🧪 Testing:');
  console.log('- Visit: https://youtube.com/watch?v=dQw4w9WgXcQ');
  console.log('- Look for the beautiful AI Summarizer card below the video');
  console.log('- Test all the gorgeous UI elements and animations');
  
  console.log('\n🎯 You should see:');
  console.log('✨ Beautiful gradient header with brand logo');
  console.log('🎮 Elegant control dropdowns with icons');
  console.log('🚀 Professional action buttons with animations');
  console.log('💫 Smooth loading animations and effects');
  
  console.log('\n🏆 Your YouTube Summarizer is now BEAUTIFUL and ready to use!');
}

// Main integration process
function main() {
  try {
    checkFiles();
    backupFiles();
    
    const contentSuccess = integrateContentJs();
    const stylesSuccess = integrateStylesCss();
    
    if (contentSuccess && stylesSuccess) {
      const validationSuccess = validateIntegration();
      
      if (validationSuccess) {
        cleanup();
        showFinalInstructions();
      } else {
        console.error('\n❌ Integration failed validation. Check backup files to restore.');
      }
    } else {
      console.error('\n❌ Integration failed. Check backup files to restore.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error during integration:', error.message);
    process.exit(1);
  }
}

// Run the integration
main();
