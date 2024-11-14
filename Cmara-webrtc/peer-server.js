// Importar PeerServer desde la biblioteca PeerJS
const { PeerServer } = require('peer');

// Crear un servidor PeerJS usando HTTPS (con el puerto y certificados SSL)
const fs = require('fs');
const https = require('https');

// Leer los certificados SSL (esto es para https)
const privateKey = fs.readFileSync('key.pem', 'utf8');
const certificate = fs.readFileSync('cert.pem', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate
};

// Crear un servidor HTTPS utilizando Node.js
const httpsServer = https.createServer(credentials);

// Configurar PeerServer en el servidor HTTPS
const peerServer = PeerServer({
  port: 9000,
  path: '/peerjs',
  secure: true,
  proxied: true,
  server: httpsServer
});

// Iniciar el servidor HTTPS junto con PeerJS
httpsServer.listen(9000, () => {
  console.log('Servidor PeerJS corriendo en https://localhost:9000');
});
