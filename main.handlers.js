const { dialog } = require('electron');
const fs = require('fs');
const xlsx = require('node-xlsx');

async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }]
  });

  if (canceled || filePaths.length === 0) { return null; }

  const filePath = filePaths[0];
  try {
    const workSheets = xlsx.parse(fs.readFileSync(filePath));
    const firstSheet = workSheets[0];
    const headers = firstSheet.data[0].filter(header => header !== null && header !== '');
    return { path: filePath, fields: headers };
  } catch (error) {
    console.error('Failed to parse Excel file:', error);
    return { error: 'Failed to parse file. Is it a valid Excel file?' };
  }
}

async function handleDataPreview(event, args) {
  const { filePath, fieldName } = args;
  if (!filePath || !fieldName) { return { error: 'File path and field name are required.' }; }

  try {
    const workSheets = xlsx.parse(fs.readFileSync(filePath));
    const firstSheet = workSheets[0];
    const headers = firstSheet.data[0];
    const columnIndex = headers.indexOf(fieldName);
    if (columnIndex === -1) { return { error: `Field '${fieldName}' not found in the file.` }; }
    const previewData = firstSheet.data.slice(1, 6).map(row => row[columnIndex] || '');
    return { data: previewData };
  } catch (error) {
    console.error('Failed to get preview data:', error);
    return { error: 'Failed to read or parse file for preview.' };
  }
}

async function handleRunTransfer(event, mappings) {
  if (!mappings || mappings.length === 0) { return { error: 'No fields have been mapped for transfer.' }; }

  const sourcePath = mappings[0].source.path;
  try {
    const sourceWorksheets = xlsx.parse(fs.readFileSync(sourcePath));
    const sourceSheet = sourceWorksheets[0];
    const sourceHeaders = sourceSheet.data[0];
    const sourceData = sourceSheet.data.slice(1);
    const destHeaders = mappings.map(m => m.dest.fieldName);
    const outputData = [destHeaders];
    const sourceHeaderIndexMap = new Map(sourceHeaders.map((h, i) => [h, i]));

    sourceData.forEach(row => {
      const newRow = [];
      for (const mapping of mappings) {
        const sourceIndex = sourceHeaderIndexMap.get(mapping.source.fieldName);
        newRow.push(row[sourceIndex]);
      }
      outputData.push(newRow);
    });

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Transferred Data',
      defaultPath: 'data-transfer-output.xlsx',
      filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });

    if (canceled || !filePath) { return { success: false, message: 'Save was canceled.' }; }

    const buffer = xlsx.build([{ name: 'Transferred Data', data: outputData }]);
    fs.writeFileSync(filePath, buffer);
    return { success: true, message: `Data successfully saved to ${filePath}` };
  } catch (error) {
    console.error('Failed to run transfer:', error);
    return { error: 'An error occurred during the data transfer process.' };
  }
}

module.exports = {
  handleFileOpen,
  handleDataPreview,
  handleRunTransfer
};
