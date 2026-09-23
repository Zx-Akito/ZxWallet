import WhatsAppService from './baileysService';

declare global {
  var __waServiceInstance: WhatsAppService | undefined;
}

export function getWhatsAppService(): WhatsAppService {
  if (!global.__waServiceInstance) {
    global.__waServiceInstance = new WhatsAppService(null);
    global.__waServiceInstance.start();
  }
  return global.__waServiceInstance;
}
