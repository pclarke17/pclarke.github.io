AFRAME.registerComponent('camera-canvas-texture', {
    schema: {
      frameRate: { type: 'number', default: 30 }  // Frames por segundo
    },
  
    init: function () {
      // Crear dinámicamente el elemento de video
      this.videoElement = document.createElement('video');
      this.videoElement.setAttribute("playsinline", "true");
      this.videoElement.autoplay = false;
      this.videoElement.muted = true; // Mutear para evitar feedback de audio
      this.videoElement.loop = true;
      this.videoElement.crossOrigin = "anonymous"; // Configuración CORS
  
      console.log("Elemento de video creado dinámicamente:", this.videoElement);
  
      // Crear el canvas para dibujar el contenido del video
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d', { willReadFrequently: true });
      console.log("Canvas creado con contexto 2D:", this.canvas, this.context);
  
      // Crear una textura a partir del canvas y asignarla al material de la caja
      this.texture = new THREE.Texture(this.canvas);
      const mesh = this.el.getObject3D('mesh');
      if (mesh) {
        mesh.material.map = this.texture;
        console.log("Textura creada y asignada al material del objeto 3D.");
      } else {
        console.error('No se encontró el mesh del elemento al cual aplicar la textura.');
        return;
      }
  
      // Inicializar última actualización
      this.lastUpdateTime = 0;
    },
  
    startHost: function (peer) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          this.videoElement.srcObject = stream;
  
          console.log("Obtenido el stream de la cámara, iniciando el Peer...");
  
          this.peer = peer;
  
          this.peer.on('call', (call) => {
            console.log('Recibida una llamada entrante, respondiendo con el stream...');
            call.answer(stream); // Responder la llamada entrante enviando el stream de la cámara
          });
  
          this.videoElement.addEventListener('loadeddata', () => {
            if (this.videoElement.readyState >= this.videoElement.HAVE_CURRENT_DATA) {
              console.log("Video de la cámara listo. Configurando el canvas.");
              this.canvas.width = this.videoElement.videoWidth;
              this.canvas.height = this.videoElement.videoHeight;
  
              this.videoElement.play().then(() => {
                console.log("El video comenzó a reproducirse exitosamente.");
                this.startCanvasUpdate(); // Iniciar la actualización del canvas
              }).catch((error) => {
                console.error("Error al intentar reproducir el video:", error);
              });
            }
          });
        })
        .catch((error) => {
          console.error('Error al acceder a la cámara:', error);
        });
    },
  
    setRemoteStream: function (stream) {
      this.videoElement.srcObject = stream;
      this.videoElement.play().catch((error) => {
        console.error("Error al reproducir el stream remoto:", error);
      });
      this.startCanvasUpdate();
    },
  
    startCanvasUpdate: function () {
      const updateCanvas = () => {
        if (this.videoElement.readyState >= this.videoElement.HAVE_ENOUGH_DATA) {
          if (this.canvas.width !== this.videoElement.videoWidth || this.canvas.height !== this.videoElement.videoHeight) {
            this.canvas.width = this.videoElement.videoWidth;
            this.canvas.height = this.videoElement.videoHeight;
            console.log("Ajuste de tamaño del canvas:", this.canvas.width, this.canvas.height);
          }
  
          try {
            this.context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
            this.texture.needsUpdate = true; // Marcar la textura para actualizarla
          } catch (error) {
            console.error("Error al dibujar el video en el canvas:", error);
          }
        }
        requestAnimationFrame(updateCanvas); // Continuar actualizando el canvas
      };
      requestAnimationFrame(updateCanvas);
    }
  });
  