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
    videoElement.setAttribute('muted', 'true'); // Para permitir la reproducción automática

    // Crear un canvas y una textura para A-Frame
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = 640;
    canvas.height = 360;

    // Crear la textura de THREE.js a partir del canvas
    const texture = new THREE.Texture(canvas);
    el.getObject3D('mesh').material.map = texture;

    let peer = null;
    let call = null;

    if (role === 'transmitter') {
      console.log("Iniciando como transmisor...");
      startTransmitter();
    } else if (role === 'receiver') {
      console.log("Iniciando como receptor...");
      startReceiver();
    } else {
      console.error("Rol inválido. No se pudo iniciar el componente.");
      return;
    }

    // Función para empezar como transmisor
    function startTransmitter() {
      console.log("Intentando iniciar PeerJS como transmisor...");

      peer = new Peer({
        host: 'localhost',
        port: 9000,
        path: '/',
        debug: 3,
        config: {
          'iceServers': [
            { url: 'stun:stun.l.google.com:19302' },
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
          });

        })
        .catch((err) => {
          console.error('Error al acceder a la cámara:', err);
        });
    }

    // Función para conectarse como receptor
    function startReceiver() {
      console.log("Intentando iniciar PeerJS como receptor...");

      peer = new Peer({
        host: 'localhost',
        port: 9000,
        path: '/',
        debug: 3,
        config: {
          'iceServers': [
            { url: 'stun:stun.l.google.com:19302' },
          ]
        }
      });

      // Cuando el receptor esté listo
      peer.on('open', (id) => {
        console.log('Receptor listo. ID de peer:', id);

        // Preguntar al usuario el ID del transmisor
        const transmitterId = prompt("Ingrese el Peer ID del transmisor:");
        if (!transmitterId) {
          alert('No se ingresó un Peer ID válido.');
          return;
        }

        console.log('Receptor intentando conectar al transmisor con ID:', transmitterId);

        // Crear un MediaStream falso (trick) para permitir la llamada
        let fakeStream = new MediaStream();

        // Intentar la llamada al transmisor con el MediaStream falso
        call = peer.call(transmitterId, fakeStream);

        // Revisar si `call` se crea correctamente
        if (!call) {
          console.error('No se pudo crear el objeto de llamada. Verifica el Peer ID ingresado.');
          return;
        }

        // Configurar los eventos de la llamada
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

            // Escuchar por actualizaciones en el video cada vez que el video esté disponible
            videoElement.addEventListener('playing', () => {
              console.log("Video remoto en reproducción, actualizando canvas.");
              updateCanvas();
            });

          } else {
            console.error('El stream remoto no contiene pistas de video.');
          }
        });

        call.on('error', (err) => {
          console.error('Receptor: Error en la llamada de PeerJS:', err);
        });
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
  }
});
