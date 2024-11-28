AFRAME.registerComponent('camera-canvas-texture', {
  schema: {
    role: { type: 'string', default: '' } // Puede ser 'transmitter' o 'receiver'
  },

  init: function () {
    const el = this.el;
    const role = this.data.role;

    // Crear un elemento de video para la transmisión o recepción
    const videoElement = document.createElement('video');
    videoElement.setAttribute('autoplay', 'true');
    videoElement.setAttribute('playsinline', 'true');
    videoElement.setAttribute('muted', role === 'transmitter'); // El transmisor necesita silenciar la cámara

    // Crear un canvas y una textura para A-Frame
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 640;
    canvas.height = 360;

    // Crear la textura de THREE.js a partir del canvas
    const texture = new THREE.Texture(canvas);
    el.getObject3D('mesh').material.map = texture;

    let peer = null;

    if (role === 'transmitter') {
      console.log("Iniciando como transmisor...");
      startTransmitter();
    } else if (role === 'receiver') {
      console.log("Iniciando como receptor...");
      addStartButton(); // Agregar un botón para iniciar la conexión del receptor.
    } else {
      console.error("Rol inválido. No se pudo iniciar el componente.");
      return;
    }

    // Función para empezar como transmisor
    function startTransmitter() {
      console.log("Intentando iniciar PeerJS como transmisor...");

      peer = new Peer({
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        debug: 3,
        config: {
          'iceServers': [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'turn:numb.viagenie.ca', username: 'webrtc@live.com', credential: 'muazkh' }
          ]
        }
      });

      peer.on('open', (id) => {
        console.log('Transmisor listo. ID de peer:', id);
        alert(`Transmisor listo. Comparte este ID con los receptores: ${id}`);
      });

      peer.on('error', (err) => {
        console.error('Error en PeerJS (Transmisor):', err);
      });

      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          console.log("Acceso a la cámara concedido.");
          videoElement.srcObject = stream;

          videoElement.onloadedmetadata = () => {
            console.log("Metadatos del video cargados. Intentando reproducir el video...");
            videoElement.play().then(() => {
              console.log("Video de la cámara está reproduciéndose.");
              updateCanvas();
            }).catch(err => {
              console.error("Error al intentar reproducir el video automáticamente:", err);
            });
          };

          // Manejar llamadas entrantes de receptores
          peer.on('call', (incomingCall) => {
            console.log('Llamada entrante recibida. Respondiendo con el stream de la cámara...');
            incomingCall.answer(stream);

            incomingCall.on('stream', (remoteStream) => {
              console.log("Transmisor ha recibido el stream remoto.");
            });

            incomingCall.on('error', (err) => {
              console.error("Error en la llamada entrante (Transmisor):", err);
            });
          });

        })
        .catch((err) => {
          console.error('Error al acceder a la cámara:', err);
        });
    }

    // Función para agregar un botón y empezar como receptor
    function addStartButton() {
      const button = document.createElement('button');
      button.innerText = 'Iniciar Receptor';
      button.style.position = 'fixed';
      button.style.top = '50%';
      button.style.left = '50%';
      button.style.transform = 'translate(-50%, -50%)';
      button.style.padding = '1rem';
      button.style.fontSize = '1.2rem';

      document.body.appendChild(button);

      button.addEventListener('click', () => {
        button.remove();
        startReceiver();
      });
    }

    // Función para conectarse como receptor
    function startReceiver() {
      console.log("Intentando iniciar PeerJS como receptor...");

      peer = new Peer({
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        debug: 3,
        config: {
          'iceServers': [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'turn:numb.viagenie.ca', username: 'webrtc@live.com', credential: 'muazkh' }
          ]
        }
      });

      peer.on('open', (id) => {
        console.log('Receptor listo. ID de peer:', id);

        // Pedir al usuario el ID del transmisor
        const transmitterId = prompt("Ingrese el Peer ID del transmisor:");
        if (!transmitterId) {
          alert('No se ingresó un Peer ID válido.');
          return;
        }

        console.log('Receptor intentando conectar al transmisor con ID:', transmitterId);

        // Crear un stream falso
        const fakeStream = createFakeStream();

        // Llamar al transmisor con el stream falso (para cumplir con el requisito)
        const call = peer.call(transmitterId, fakeStream);

        if (call) {
          call.on('stream', (remoteStream) => {
            console.log('Recibiendo transmisión remota...');

            // Verificar que el stream tenga pistas de video
            if (remoteStream.getVideoTracks().length > 0) {
              console.log('Stream remoto contiene pistas de video.');

              // Configurar el elemento de video con el stream recibido
              videoElement.srcObject = remoteStream;
              videoElement.onloadedmetadata = () => {
                console.log("Stream remoto está listo, intentando reproducir...");
                videoElement.play().then(() => {
                  console.log("Video recibido está reproduciéndose.");
                  updateCanvas();
                }).catch(err => {
                  console.error("Error al intentar reproducir el video remoto:", err);
                });
              };
            } else {
              console.error('El stream remoto no contiene pistas de video.');
            }
          });

          call.on('error', (err) => {
            console.error('Error en la llamada al transmisor (Receptor):', err);
          });
        } else {
          console.error('No se pudo crear el objeto de llamada. Verifica el Peer ID ingresado.');
        }
      });

      peer.on('disconnected', () => {
        console.error("El receptor ha sido desconectado del servidor PeerJS.");
      });

      peer.on('error', (err) => {
        console.error('Receptor: Error en PeerJS:', err);
        if (err.type === 'peer-unavailable') {
          alert('El Peer ID ingresado no está disponible. Asegúrate de que el transmisor esté en línea.');
        }
      });
    }

    // Función para actualizar el canvas y la textura
    function updateCanvas() {
      if (!videoElement.paused && !videoElement.ended) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        texture.needsUpdate = true; // Asegurarse de que la textura se actualice
      }
      requestAnimationFrame(updateCanvas);
    }

    // Función para crear un stream falso
    function createFakeStream() {
      const fakeCanvas = document.createElement('canvas');
      fakeCanvas.width = 1;
      fakeCanvas.height = 1;

      const fakeCtx = fakeCanvas.getContext('2d');
      fakeCtx.fillStyle = 'black';
      fakeCtx.fillRect(0, 0, 1, 1);

      const stream = fakeCanvas.captureStream();
      return stream;
    }
  }
});
