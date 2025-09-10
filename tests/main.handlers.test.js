// Mock dependencies that are not standard node modules
jest.mock('electron', () => ({
  dialog: {
    showOpenDialog: jest.fn(),
    showSaveDialog: jest.fn(),
  }
}), { virtual: true });

// We will mock fs methods manually where needed
const fs = require('fs');
jest.spyOn(fs, 'readFileSync').mockImplementation(() => {});
jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});


// Import the real xlsx and then mock its methods
const xlsx = require('node-xlsx');
xlsx.parse = jest.fn();
xlsx.build = jest.fn();

const { dialog } = require('electron');
const { handleFileOpen, handleDataPreview, handleRunTransfer } = require('./main.handlers.js');


describe('Main Process Handlers', () => {

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    xlsx.parse.mockClear();
    xlsx.build.mockClear();
  });

  describe('handleFileOpen', () => {
    it('should return file path and headers on successful file selection', async () => {
      const mockFilePath = '/path/to/test.xlsx';
      const mockHeaders = ['ID', 'Name', 'Value'];
      const mockExcelData = [{ name: 'Sheet1', data: [mockHeaders, [1, 'Test', 100]] }];
      dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [mockFilePath] });
      fs.readFileSync.mockReturnValue('mock buffer');
      xlsx.parse.mockReturnValue(mockExcelData);

      const result = await handleFileOpen();

      expect(result).toEqual({ path: mockFilePath, fields: mockHeaders });
    });

    it('should return null if the dialog is canceled', async () => {
      dialog.showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] });
      const result = await handleFileOpen();
      expect(result).toBeNull();
    });
  });

  describe('handleDataPreview', () => {
    it('should return the first 5 rows of data for a specified field', async () => {
        const mockArgs = { filePath: '/path/to/preview.xlsx', fieldName: 'Name' };
        const mockExcelData = [{ name: 'Sheet1', data: [['ID', 'Name'], [1, 'Alice'], [2, 'Bob'], [3, 'Charlie'], [4, 'David'], [5, 'Eve'], [6, 'Frank']] }];
        xlsx.parse.mockReturnValue(mockExcelData);
        const result = await handleDataPreview({}, mockArgs);
        expect(result.data).toEqual(['Alice', 'Bob', 'Charlie', 'David', 'Eve']);
    });
  });

  describe('handleRunTransfer', () => {
    it('should correctly transform data and call writeFileSync', async () => {
        const mappings = [
            { source: { path: '/path/to/source.xlsx', fieldName: 'Name' }, dest: { fieldName: 'Customer Name' } },
            { source: { path: '/path/to/source.xlsx', fieldName: 'Value' }, dest: { fieldName: 'Amount' } },
        ];
        const mockSourceData = [{ name: 'Sheet1', data: [['ID', 'Name', 'Value'],[1, 'Alice', 100],[2, 'Bob', 200]] }];
        xlsx.parse.mockReturnValue(mockSourceData);
        dialog.showSaveDialog.mockResolvedValue({ canceled: false, filePath: '/path/to/output.xlsx' });
        xlsx.build.mockReturnValue('mock buffer');

        const result = await handleRunTransfer({}, mappings);

        const expectedOutputData = [['Customer Name', 'Amount'], ['Alice', 100], ['Bob', 200]];
        expect(xlsx.build).toHaveBeenCalledWith([{ name: 'Transferred Data', data: expectedOutputData }]);
        expect(fs.writeFileSync).toHaveBeenCalledWith('/path/to/output.xlsx', 'mock buffer');
        expect(result.success).toBe(true);
    });
  });
});
