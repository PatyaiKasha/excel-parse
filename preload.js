const { contextBridge, ipcRenderer } = require('electron');

// Expose a controlled set of APIs to the renderer process under the 'window.electronAPI' object.
contextBridge.exposeInMainWorld('electronAPI', {
  // For opening a file
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  // For getting preview data from a file
  getPreviewData: (args) => ipcRenderer.invoke('data:getPreview', args),
  // For running the full data transfer
  runTransfer: (mappings) => ipcRenderer.invoke('data:runTransfer', mappings)
});

console.log('Preload script with contextBridge loaded.');
