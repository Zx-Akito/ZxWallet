import http from 'http';

console.log('🤖 ZxWallet WhatsApp Bot Listener Daemon is active.');

let lastStatus = null;

function checkBotStatus() {
  const req = http.get('http://localhost:3000/api/wa/status', (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.success && json.data) {
          const currentStatus = json.data.status;
          if (currentStatus !== lastStatus) {
            lastStatus = currentStatus;
            if (currentStatus === 'connected') {
              console.log('✅ WhatsApp bot successfully connected!');
            } else if (currentStatus === 'qr_ready') {
              console.log('📱 WhatsApp QR Code siap dipindai di Dashboard: http://localhost:3000');
            } else {
              console.log(`ℹ️ WhatsApp status: ${currentStatus}`);
            }
          }
        }
      } catch {
        // Response parsing ignored
      }
    });
  });

  req.on('error', () => {
    // Next.js server might still be booting up
  });
}

setTimeout(checkBotStatus, 2000);
setInterval(checkBotStatus, 10000);
