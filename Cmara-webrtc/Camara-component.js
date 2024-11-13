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
      // Intentar acceder a la cámara del ordenador
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          // Asignar el stream al elemento de video
          this.videoElement.srcObject = stream;
  
          // Crear instancia de Peer para transmitir el stream
          this.peer = peer;
  
          this.peer.on('open', (id) => {
            console.log(`Tu ID es: ${id}. Comparte este ID con los espectadores para que se conecten.`);
  
            // Mostrar el ID del transmisor en la página
            const peerIdElement = document.getElementById('peer-id');
            peerIdElement.textContent = id;
  
            const transmitterIdDiv = document.getElementById('transmitter-id');
            transmitterIdDiv.style.display = 'block';
          });
  
          this.peer.on('call', (call) => {
            // Responder la llamada entrante enviando el stream de la cámara
            call.answer(stream);
          });
  
          // Esperar a que el video esté listo para reproducir
          this.videoElement.addEventListener('loadeddata', () => {
            if (this.videoElement.readyState >= this.videoElement.HAVE_CURRENT_DATA) {
              console.log("Video de la cámara listo. Configurando el canvas.");
  
              // Configurar el tamaño del canvas basado en el tamaño del video
              this.canvas.width = this.videoElement.videoWidth;
              this.canvas.height = this.videoElement.videoHeight;
  
              // Reproducir el video y comenzar la actualización del canvas
              this.videoElement.play().then(() => {
                console.log("El video comenzó a reproducirse exitosamente.");
                this.startCanvasUpdate();
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
      // Asignar el stream remoto al video y comenzar la reproducción
      this.videoElement.srcObject = stream;
      this.videoElement.play().catch((error) => {
        console.error("Error al reproducir el stream remoto:", error);
      });
    },
  
    tick: function (time, timeDelta) {
      // Actualizar solo si el video tiene suficientes datos y ha pasado suficiente tiempo desde la última actualización
      if (this.videoElement && this.videoElement.readyState >= this.videoElement.HAVE_ENOUGH_DATA) {
        if (time - this.lastUpdateTime > 1000 / this.data.frameRate) {
          this.context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
          this.texture.needsUpdate = true; // Marcar la textura para actualizarla
          this.lastUpdateTime = time; // Actualizar el tiempo de la última actualización
        }
      }
    }
  });
  