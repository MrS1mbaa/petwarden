const { LoadSkiaWeb } = require('@shopify/react-native-skia/lib/module/web');

LoadSkiaWeb({ locateFile: () => '/canvaskit.wasm' })
  .then(() => require('expo-router/entry'))
  .catch(() => {
    const message = document.createElement('p');
    message.textContent = 'Prikaz nije učitan. Osveži stranicu i pokušaj ponovo.';
    document.body.appendChild(message);
  });
