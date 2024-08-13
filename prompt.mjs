
import fs from 'fs/promises';
import path from 'path';

// List of files to be merged into PROMPT.md
// const filesToMerge = [
//   './src/app.controller.ts',
//   './src/app.module.ts',
//   './src/app.service.ts',
//   './src/main.ts',
//   './views/index.ejs',
//   './CURRENT_ERROR.md',
//   './TODO.md'
// ];

const filesToMerge = [
  // './src/auth/auth.module.ts',
  // './src/auth/cookie.strategy.ts',
  // './src/types/express.d.ts',
  './src/components/base.component.ts',
  './src/components/number-generator.component.ts',
  './src/components/number-multiplier.component.ts',
  './src/interfaces/component.interface.ts',
  './src/interfaces/flow.interface.ts',
  './src/modules/app.module.ts',
  './src/processors/event.processor.ts',
  './src/services/component-registry.service.ts',
  './src/services/flow-executor.service.ts',
  './src/main.ts',
  './CURRENT_ERROR.md',
  './TODO.md'
];

// Helper function to get file extension
const getFileType = (filePath) => {
  return path.extname(filePath).substring(1); // Remove the dot from the extension
};

// Main function to create PROMPT.md
const createPromptFile = async () => {
  let content = 'Please follow the instructions within ./TODO.md! Thank you :)\n';

  for (const file of filesToMerge) {
    try {
      const fileContent = await fs.readFile(file, 'utf8');
      const fileType = getFileType(file);
      content += `### ${file}\n\`\`\`${fileType}\n${fileContent}\n\`\`\`\n\n`;
    } catch (err) {
      console.error(`Error reading file ${file}:`, err);
    }
  }

  try {
    await fs.writeFile('PROMPT.md', content, 'utf8');
    console.log('PROMPT.md has been created successfully.');
  } catch (err) {
    console.error('Error writing PROMPT.md:', err);
  }
};

createPromptFile();