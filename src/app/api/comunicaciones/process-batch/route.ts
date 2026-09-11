import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { EmailProvider } from "@/lib/email/provider"

// Configuración del lote
const BATCH_SIZE = 50

export async function POST(request: Request) {
  try {
    const { campaignId } = await request.json()

    if (!campaignId) {
      return NextResponse.json({ success: false, error: "campaignId is required" }, { status: 400 })
    }

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId }
    })

    if (!campaign || (campaign.status !== 'ENVIANDO' && campaign.status !== 'PROGRAMADA')) {
      return NextResponse.json({ success: false, error: "Campaña no válida para envío" }, { status: 400 })
    }

    // Get a batch of pending recipients
    const pendingRecipients = await prisma.emailCampaignRecipient.findMany({
      where: { campaignId, status: 'PENDING' },
      take: BATCH_SIZE
    })

    if (pendingRecipients.length === 0) {
      // Finished sending
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { 
          status: 'ENVIADA',
          sentAt: new Date()
        }
      })
      return NextResponse.json({ success: true, message: "Campaign finished" })
    }

    const blocks = JSON.parse(campaign.bodyBlocks)
    let batchSuccessful = 0
    let batchFailed = 0

    // Process batch (in production you would group these and send them concurrently depending on provider limits)
    for (const recipient of pendingRecipients) {
      // Validate that the user hasn't unsubscribed recently
      const user = await prisma.user.findUnique({ where: { email: recipient.email } })
      
      if (user && !user.emailMarketingConsent) {
        // They unsubscribed between the campaign creation and the batch execution
        await prisma.emailCampaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'UNSUBSCRIBED', errorMsg: 'Usuario se dio de baja' }
        })
        continue // Skip sending
      }

      const unsubscribeUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(recipient.email)}&t=${
        require('crypto').createHash('sha256').update(recipient.email + (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "default_secret")).digest('hex')
      }`

      const html = EmailProvider.renderHtml(blocks, campaign.subject, campaign.preheader || '', unsubscribeUrl)

      const success = await EmailProvider.sendEmail({
        to: recipient.email,
        subject: campaign.subject,
        html
      })

      if (success) {
        batchSuccessful++
        await prisma.emailCampaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'DELIVERED', sentAt: new Date() } // Simplification: SENT->DELIVERED
        })
      } else {
        batchFailed++
        await prisma.emailCampaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'FAILED', errorMsg: 'Error del proveedor de correo' }
        })
      }
    }

    // Update campaign metrics
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        sentCount: { increment: batchSuccessful },
        failedCount: { increment: batchFailed }
      }
    })

    // If there are exactly BATCH_SIZE, it means there are probably more. Call ourselves again.
    if (pendingRecipients.length === BATCH_SIZE) {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      // Fire and forget
      fetch(`${baseUrl}/api/comunicaciones/process-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      }).catch(e => console.error("Error scheduling next batch:", e))
    } else {
      // Finished
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { 
          status: 'ENVIADA',
          sentAt: new Date()
        }
      })
    }

    return NextResponse.json({ success: true, processed: pendingRecipients.length, successful: batchSuccessful, failed: batchFailed })
  } catch (error: any) {
    console.error("Batch processing error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
