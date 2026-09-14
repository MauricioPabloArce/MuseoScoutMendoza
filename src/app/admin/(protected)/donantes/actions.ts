"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"

async function checkAdminOrCollab() {
  const session = await auth()
  if (!session?.user) throw new Error("No autenticado")
  
  const member = await prisma.museumMember.findUnique({
    where: { userId: session.user.id }
  })
  
  if (!member) throw new Error("Acceso denegado")
  return member
}

export async function getDonors(page = 1, pageSize = 20, q = "") {
  await checkAdminOrCollab();
  
  const where: any = {};
  if (q) {
    where.OR = [
      { displayName: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
      { normalizedName: { contains: q.toLowerCase() } }
    ];
  }

  const [donors, total] = await Promise.all([
    prisma.donor.findMany({
      where,
      orderBy: { displayName: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: { pieces: true }
        }
      }
    }),
    prisma.donor.count({ where })
  ]);

  return { donors, total, pages: Math.ceil(total / pageSize) };
}

export async function getDonor(id: string) {
  await checkAdminOrCollab();
  return prisma.donor.findUnique({
    where: { id },
    include: {
      pieces: {
        include: {
          category: true
        },
        orderBy: { registeredAt: 'desc' }
      }
    }
  });
}

function normalizeName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export async function createDonor(data: { displayName: string, firstName?: string, lastName?: string, email?: string, phone?: string, notes?: string }) {
  const member = await checkAdminOrCollab();
  
  return prisma.donor.create({
    data: {
      ...data,
      normalizedName: normalizeName(data.displayName),
      createdBy: member.id,
      updatedBy: member.id,
    }
  });
}

export async function updateDonor(id: string, data: { displayName?: string, firstName?: string, lastName?: string, email?: string, phone?: string, notes?: string, active?: boolean }) {
  const member = await checkAdminOrCollab();
  
  const updateData: any = { ...data, updatedBy: member.id };
  if (data.displayName) {
    updateData.normalizedName = normalizeName(data.displayName);
  }

  return prisma.donor.update({
    where: { id },
    data: updateData
  });
}

export async function searchDonors(q: string) {
  await checkAdminOrCollab();
  
  if (!q) return [];
  
  const searchStr = normalizeName(q);
  
  return prisma.donor.findMany({
    where: {
      active: true,
      OR: [
        { displayName: { contains: q } },
        { normalizedName: { contains: searchStr } },
        { email: { contains: q } },
        { phone: { contains: q } }
      ]
    },
    take: 10,
    orderBy: { displayName: 'asc' }
  });
}

export async function checkPossibleDuplicates(email?: string, phone?: string, displayName?: string) {
  await checkAdminOrCollab();
  
  const conditions = [];
  if (email && email.trim() !== '') conditions.push({ email });
  if (phone && phone.trim() !== '') conditions.push({ phone });
  if (displayName && displayName.trim() !== '') {
    conditions.push({ normalizedName: normalizeName(displayName) });
  }

  if (conditions.length === 0) return [];

  return prisma.donor.findMany({
    where: {
      active: true,
      OR: conditions
    },
    take: 5
  });
}

export async function mergeDonors(primaryId: string, secondaryId: string) {
  await checkAdminOrCollab();
  
  if (primaryId === secondaryId) throw new Error("No puedes fusionar un donante consigo mismo");

  // Transfer all pieces
  await prisma.museumPiece.updateMany({
    where: { donorId: secondaryId },
    data: { donorId: primaryId }
  });

  // Deactivate secondary
  await prisma.donor.update({
    where: { id: secondaryId },
    data: { active: false }
  });

  return { success: true };
}
