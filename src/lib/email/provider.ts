/**
 * Abstracción del proveedor de correos electrónicos.
 * El proyecto usa variables de entorno para configurar el proveedor (ej. SendGrid, Resend, SMTP local).
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailProvider {
  /**
   * Envía un único correo
   */
  static async sendEmail(message: EmailMessage): Promise<boolean> {
    try {
      // Simulación de envío: en producción esto llamaría a la API de SendGrid/Resend/SMTP.
      console.log(`[EmailProvider] Enviando correo a ${message.to} - Asunto: ${message.subject}`)
      
      // Simular un pequeño retardo de red
      await new Promise(resolve => setTimeout(resolve, 100))
      
      return true
    } catch (error) {
      console.error("[EmailProvider] Error al enviar correo:", error)
      return false
    }
  }

  /**
   * Envía un lote (batch) de correos
   */
  static async sendBatch(messages: EmailMessage[]): Promise<{ successful: number, failed: number }> {
    let successful = 0
    let failed = 0

    for (const msg of messages) {
      const result = await this.sendEmail(msg)
      if (result) successful++
      else failed++
    }

    return { successful, failed }
  }

  /**
   * Renderiza los bloques del editor a HTML compatible con clientes de correo
   */
  static renderHtml(blocks: any[], subject: string, preheader: string, unsubscribeUrl: string): string {
    const blocksHtml = blocks.map(b => {
      switch (b.type) {
        case 'title':
          return `<h2 style="color: #1f2937; font-family: sans-serif; font-size: 24px; font-weight: bold; margin-bottom: 16px;">${b.content}</h2>`
        case 'text':
          return `<p style="color: #4b5563; font-family: sans-serif; font-size: 16px; line-height: 1.5; margin-bottom: 16px; white-space: pre-line;">${b.content}</p>`
        case 'image':
          return `<img src="${b.url}" style="width: 100%; max-width: 600px; height: auto; border-radius: 8px; margin-bottom: 16px;" alt="Imagen adjunta" />`
        case 'button':
          return `
            <div style="text-align: center; margin: 24px 0;">
              <a href="${b.link}" style="background-color: #0B69CA; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-family: sans-serif; font-weight: bold; display: inline-block;">
                ${b.content}
              </a>
            </div>
          `
        default:
          return ''
      }
    }).join('\n')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="background-color: #f9fafb; padding: 20px; font-family: sans-serif; margin: 0;">
        ${preheader ? `<span style="display: none; font-size: 0px; line-height: 0px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${preheader}</span>` : ''}
        
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          <!-- Header -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: bold; letter-spacing: 2px;">MUSEO SCOUT MENDOZA</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              ${blocksHtml}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 12px 0;">
                Recibís este correo porque aceptaste recibir novedades del Museo Scout Mendoza.
              </p>
              <a href="${unsubscribeUrl}" style="color: #0B69CA; font-size: 12px; text-decoration: underline;">
                Dejar de recibir estas comunicaciones
              </a>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }
}
