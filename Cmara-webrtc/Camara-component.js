AFRAME.registerComponent('camera-canvas-texture', {
  schema: {
    frameRate: { type: 'number', default: 30 }  // Frames por segundo
  },

  init: function () {
    const el = this.el;

    // Crear dinámicamente el elemento de video para la cámara
    this.videoElement = document.createElement('video');
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;  // Reproducción en línea (necesario para dispositivos móviles)
    this.videoElement.muted = true;  // Silenciar el video para evitar problemas de reproducción automática
    this.videoElement.loop = true;  // Repetir el video

    console.log("Elemento de video creado dinámicamente para la cámara:", this.videoElement);

    // Crear un canvas para dibujar el contenido del video
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d', { willReadFrequently: true });
    console.log("Canvas creado con contexto 2D:", this.canvas, this.context);

    // Crear una textura a partir del canvas y asignarla al material del objeto 3D
    this.texture = new THREE.Texture(this.canvas);
    const mesh = this.el.getObject3D('mesh');
    if (mesh) {
      mesh.material.map = this.texture;
      console.log("Textura creada y asignada al material del objeto 3D.");
    } else {
      console.error('No se encontró el mesh del elemento al cual aplicar la textura.');
      return;
    }

    // Crear Peer con simple-peer
    const isInitiator = location.hash === '#1';
    this.peer = new SimplePeer({ initiator: isInitiator, trickle: false });

    // Si es el iniciador, obtener acceso a la cámara y agregar el stream
    if (isInitiator) {
      navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })
      .then((stream) => {
        console.log("Stream obtenido para el iniciador");
        this.videoElement.srcObject = stream;

        this.videoElement.addEventListener('loadeddata', () => {
          if (this.videoElement.readyState >= this.videoElement.HAVE_CURRENT_DATA) {
            console.log("Stream de cámara listo. Configurando el canvas.");
            this.canvas.width = this.videoElement.videoWidth;
            this.canvas.height = this.videoElement.videoHeight;

            this.videoElement.play().then(() => {
              console.log("Video de la cámara reproduciéndose automáticamente.");
            }).catch((error) => {
              console.error("Error al intentar reproducir el video:", error);
            });
          }
        });

        // Agregar el stream al Peer
        this.peer.addStream(stream);

        // Mostrar la señal para copiarla manualmente
        this.peer.on('signal', (data) => {
          console.log('SIGNAL', JSON.stringify(data));
        });

      }).catch((error) => {
        console.error('Error al acceder a la cámara:', error);
      });
    }

    // Manejar el stream recibido para el receptor
    this.peer.on('stream', (remoteStream) => {
      console.log('Recibiendo transmisión remota');
      this.videoElement.srcObject = remoteStream;

      this.videoElement.addEventListener('loadeddata', () => {
        if (this.videoElement.readyState >= this.videoElement.HAVE_CURRENT_DATA) {
          this.canvas.width = this.videoElement.videoWidth;
          this.canvas.height = this.videoElement.videoHeight;

          this.videoElement.play().then(() => {
            console.log("Video remoto reproduciéndose automáticamente.");
            this.startUpdatingCanvas();
          }).catch((error) => {
            console.error("Error al intentar reproducir el video remoto:", error);
          });
        }
      });
    });

    // Manejar errores
    this.peer.on('error', (err) => {
      console.error('Error en SimplePeer:', err);
    });

    // Iniciar la actualización del canvas después de que el video se esté reproduciendo
    this.videoElement.addEventListener('play', () => {
      this.startUpdatingCanvas();
    });
  },

  startUpdatingCanvas: function () {
    const updateCanvas = () => {
      if (!this.videoElement.paused && !this.videoElement.ended) {
        console.log("Dibujando el video en el canvas...");
        this.context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);

        // Actualizar la textura
        this.texture.needsUpdate = true;
        requestAnimationFrame(updateCanvas);
      } else {
        console.warn("El video aún no tiene suficientes datos para ser dibujado.");
      }
    };
    requestAnimationFrame(updateCanvas);
  },

  tick: function () {
    // No necesitamos usar `tick` ya que estamos usando requestAnimationFrame para actualizar el canvas.
  }
});
