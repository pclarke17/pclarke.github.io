AFRAME.registerComponent('camera-canvas-texture', {
  schema: {
    frameRate: { type: 'number', default: 30 }  // Frames por segundo, ajustable según el rendimiento
  },

  init: function () {
    // Crear y configurar el elemento de video
    this.videoElement = document.createElement('video');
    this.videoElement.setAttribute("playsinline", "true");
    this.videoElement.autoplay = false;  // Cambiar a false para evitar problemas con autoplay
    this.videoElement.muted = false;      // Mutear el video para permitir la reproducción automática
    this.videoElement.loop = true;
    this.videoElement.crossOrigin = "anonymous"; // Para evitar problemas de CORS

    console.log("Elemento de video creado dinámicamente para la cámara:", this.videoElement);

    // Intentar acceder a la cámara del ordenador
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        // Asignar el stream al elemento de video
        this.videoElement.srcObject = stream;

        // Esperar a que el video esté listo
        this.videoElement.addEventListener('loadeddata', () => {
          if (this.videoElement.readyState >= this.videoElement.HAVE_CURRENT_DATA) {
            console.log("Video de la cámara listo. Configurando el canvas.");

            // Crear el canvas para dibujar el contenido del video
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext('2d', { willReadFrequently: true });

            // Configurar el tamaño del canvas basado en el tamaño del video
            this.canvas.width = this.videoElement.videoWidth;
            this.canvas.height = this.videoElement.videoHeight;

            console.log("Canvas creado con tamaño:", this.canvas.width, "x", this.canvas.height);

            // Crear una textura a partir del canvas y asignarla al material de la caja
            this.texture = new THREE.Texture(this.canvas);
            const mesh = this.el.getObject3D('mesh');

            if (mesh) {
              // Crear un material con la textura y asignarlo al mesh
              mesh.material = new THREE.MeshBasicMaterial({ map: this.texture });
              console.log("Textura creada y asignada al material del objeto 3D.");

              // Reproducir el video manualmente tras asegurar que el contexto esté listo
              this.videoElement.play().then(() => {
                console.log("El video comenzó a reproducirse exitosamente.");
                // Comenzar a actualizar el canvas
                this.startCanvasUpdate();
              }).catch((error) => {
                console.error("Error al intentar reproducir el video:", error);
              });
            } else {
              console.error('No se encontró el mesh del elemento al cual aplicar la textura.');
            }
          } else {
            console.error("El video de la cámara no está listo para ser procesado.");
          }
        });
      })
      .catch((error) => {
        console.error('Error al acceder a la cámara:', error);
      });

    // Variable para controlar la frecuencia de actualización del canvas
    this.lastUpdateTime = 0;
  },

  tick: function (time, timeDelta) {
    // Actualizar solo si el video tiene suficientes datos y ha pasado suficiente tiempo desde la última actualización
    if (this.videoElement && this.videoElement.readyState >= this.videoElement.HAVE_ENOUGH_DATA) {
      // Controlar la frecuencia de actualización del canvas basado en el frameRate especificado
      if (time - this.lastUpdateTime > 1000 / this.data.frameRate) {
        // Dibujar el frame del video en el canvas
        this.context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);

        // Marcar la textura para actualizarla
        this.texture.needsUpdate = true;

        // Actualizar el tiempo de la última actualización
        this.lastUpdateTime = time;

        console.log("Canvas actualizado con datos de video en tick().");
      }
    }
  }
});
