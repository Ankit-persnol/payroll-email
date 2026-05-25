const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  parseCsv: (text) => ipcRenderer.invoke('csv:parse', text),

  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (s) => ipcRenderer.invoke('settings:save', s),

  getTemplate: () => ipcRenderer.invoke('template:get'),
  saveTemplate: (t) => ipcRenderer.invoke('template:save', t),

  getHistory: (opts) => ipcRenderer.invoke('history:get', opts),
  getStats: () => ipcRenderer.invoke('history:stats'),
  exportHistoryCsv: () => ipcRenderer.invoke('history:export'),
  retryEmail: (id) => ipcRenderer.invoke('email:retry', id),

  sendTestEmail: (s) => ipcRenderer.invoke('email:test', s),
  sendBatch: (rows, onProgress) => {
    const listener = (_e, p) => onProgress && onProgress(p);
    ipcRenderer.on('email:progress', listener);
    const promise = ipcRenderer.invoke('email:sendBatch', rows);
    promise.finally(() => ipcRenderer.removeListener('email:progress', listener));
    return promise;
  },
});
