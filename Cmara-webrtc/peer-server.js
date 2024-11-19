AFRAME.registerComponent('peer-connection', {
  schema: {
    role: { type: 'string', default: 'transmitter' }, // Puede ser 'transmitter' o 'receiver'
    peerId: { type: 'string', default: '' } // Solo se necesita para el receptor
  },

  init: function () {
    this.isTransmitter = this.data.role === 'transmitter';
    this.peer = new Peer(null, {
      host: 'localhost', // Cambia esto por la IP del servidor PeerJS
      port: 9000,
      path: '/',
      secure: false
    });

    if (this.isTransmitter) {
      this.initTransmitter();
    } else {
      this.initReceiver();
    }
  },

  initTransmitter: function () {
    this.peer.on('open', (id) => {
      console.log("Transmisor: Mi ID de peer es:", id);
      alert(`Transmisor listo. Comparte este ID con los receptores: ${id}`);
    });

    this.peer.on('call', (call) => {
      console.log("Transmisor: Llamada entrante recibida.");
      const videoComponent = document.querySelector('[camera-component]');
      if (videoComponent) {
        const stream = videoComponent.components['camera-component'].videoElement.srcObject;
        call.answer(stream);
      } else {
        console.error("No se encontró el componente de cámara.");
      }
    });
  },

  initReceiver: function () {
    const peerID = this.data.peerId;
  
    if (!peerID) {
      console.error('El ID del Peer proporcionado es inválido o está vacío.');
      return;
    }
  
    console.log(`Receptor: Intentando conectar al Peer ID del transmisor: ${peerID}`);
  
    this.peer.on('open', () => {
      console.log('Receptor: Conexión abierta con PeerJS, intentando conectar con el transmisor.');
  
      const call = this.peer.call(peerID, null);
  
      if (!call) {
        console.error("Error al realizar la llamada: el objeto 'call' no fue creado. Verifica el Peer ID del transmisor.");
        alert("Error en la conexión. Verifica el Peer ID ingresado e inténtalo de nuevo.");
        return;
      }
  
      call.on('stream', (remoteStream) => {
        console.log('Receptor: Recibido el stream desde el transmisor.');
        const videoElement = document.createElement('video');
        videoElement.srcObject = remoteStream;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
  
        document.body.appendChild(videoElement);
      });
  
      call.on('error', (err) => {
        console.error('Error en la llamada de PeerJS:', err);
      });
    });
  
    this.peer.on('error', (err) => {
      console.error('Error en PeerJS:', err);
    });
  }
  
});
