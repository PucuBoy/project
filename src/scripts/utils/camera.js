class Camera {
    constructor(videoElement) {
        this.videoElement = videoElement;
        this.stream = null;
        this.isActive = false;
    }

    async start() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment'
                },
                audio: false
            });
            this.videoElement.srcObject = this.stream;
            this.isActive = true;
            
            return new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play();
                    resolve();
                };
            });
        } catch (error) {
            console.error('Camera error:', error);
            throw new Error('Tidak dapat mengakses kamera');
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
            });
            if (this.videoElement) {
                this.videoElement.srcObject = null;
            }
            this.stream = null;
            this.isActive = false;
        }
    }

    isStreamActive() {
        return this.isActive && this.stream && this.stream.active;
    }

    async takePhoto() {
        if (!this.videoElement) return null;

        const canvas = document.createElement('canvas');
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;
        
        const context = canvas.getContext('2d');
        context.drawImage(this.videoElement, 0, 0);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.8);
        });
    }
}

export default Camera;