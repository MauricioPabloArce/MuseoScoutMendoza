import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    // Verify user is an admin or superadmin (requires checking MuseumMember role)
    const member = await prisma.museumMember.findUnique({
      where: { userId: session.user.id }
    })
    
    if (!member || (member.role !== 'ADMIN' && member.role !== 'SUPERADMIN')) {
      return NextResponse.json({ success: false, error: "Permisos insuficientes" }, { status: 403 })
    }

    const data = await request.json()
    const { internalName, subject, preheader, blocks } = data

    if (!internalName || !subject || !blocks || !Array.isArray(blocks)) {
      return NextResponse.json({ success: false, error: "Faltan datos obligatorios" }, { status: 400 })
    }

    // Get all subscribed users
    const subscribers = await prisma.user.findMany({
      where: { emailMarketingConsent: true, email: { not: null } }
    })

    if (subscribers.length === 0) {
      return NextResponse.json({ success: false, error: "No hay destinatarios activos" }, { status: 400 })
    }

    // 1. Create the campaign
    const campaign = await prisma.emailCampaign.create({
      data: {
        internalName,
        subject,
        preheader: preheader || null,
        bodyBlocks: JSON.stringify(blocks),
        status: "ENVIANDO",
        totalRecipients: subscribers.length,
        createdBy: session.user.id
      }
    })

    // 2. Create the recipients
    const recipientData = subscribers.map(sub => ({
      campaignId: campaign.id,
      userId: sub.id,
      email: sub.email!,
      status: "PENDING"
    }))

    // Use createMany to insert recipients in bulk
    await prisma.emailCampaignRecipient.createMany({
      data: recipientData
    })

    // 3. Trigger the background process asynchronously.
    // In Next.js App Router (Node.js runtime, which this is since it's Prisma and SQLite),
    // we can simply not await the promise and it will run in the background (unless Vercel kills it, but this is a standard VPS via PM2 so it will keep running).
    // To make it more decoupled, we could call another local API route. Let's do that for safety.
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    fetch(`${baseUrl}/api/comunicaciones/process-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: campaign.id })
    }).catch(err => console.error("Error triggering batch process:", err))

    return NextResponse.json({ success: true, campaignId: campaign.id })
  } catch (error: any) {
    console.error("Error creating campaign:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
