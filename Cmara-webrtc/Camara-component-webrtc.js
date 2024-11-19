AFRAME.registerComponent('camera-component', {
  schema: {
    frameRate: { type: 'number', default: 30 }
  },

  init: function () {
    console.log('Inicializando componente de cámara.');
    this.videoElement = document.createElement('video');
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    this.videoElement.muted = true;

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d', { willReadFrequently: true });

    this.texture = new THREE.Texture(this.canvas);
    const mesh = this.el.getObject3D('mesh');
    if (mesh) {
      mesh.material.map = this.texture;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        this.videoElement.srcObject = stream;
        this.videoElement.addEventListener('loadedmetadata', () => {
          this.canvas.width = this.videoElement.videoWidth;
          this.canvas.height = this.videoElement.videoHeight;
          this.updateCanvas();
        });
      })
      .catch((error) => {
        console.error('Error al acceder a la cámara:', error);
      });
  },

  updateCanvas: function () {
    if (this.videoElement && this.videoElement.readyState >= this.videoElement.HAVE_ENOUGH_DATA) {
      this.context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
      this.texture.needsUpdate = true;
    }
    requestAnimationFrame(this.updateCanvas.bind(this));
  }
});
