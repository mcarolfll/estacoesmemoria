const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

// Configuração para evitar warnings de segurança no console
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    kiosk: true, // Modo Kiosk (trava o usuário e esconde a barra de tarefas)
    autoHideMenuBar: true, // Esconde menu superior
    frame: false, // Remove bordas e barras de título
    alwaysOnTop: true, // Mantém a janela sempre no topo (opcional, bom para totens)
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Necessário para nodeIntegration funcionar simplificado
      devTools: false // Desabilita DevTools em produção
    },
    icon: path.join(__dirname, 'assets/img/trevo.avif')
  });

  // Carrega o arquivo index.html localmente
  mainWindow.loadFile('index.html');

  // TRAVA DE SEGURANÇA: Bloquear Alt+F4 e fechamento comum
  // O evento 'close' é emitido quando o usuário tenta fechar a janela
  mainWindow.on('close', (e) => {
    // Previne o fechamento da janela
    e.preventDefault(); 
  });

  // Atalho de emergência para desenvolvedores/técnicos saírem do app (Ctrl+Shift+Q)
  globalShortcut.register('CommandOrControl+Shift+Q', () => {
    // app.exit() força o encerramento ignorando o evento 'close'
    app.exit(0); 
  });
  
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Inicialização do Electron
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Impede que o app feche quando todas as janelas forem fechadas (padrão Mac, mas útil aqui)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    // Em um app normal sairíamos aqui, mas no totem queremos que ele persista 
    // ou saia apenas via atalho de emergência.
    // app.quit(); 
  }
});
