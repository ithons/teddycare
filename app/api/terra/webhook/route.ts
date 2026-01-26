import { NextRequest, NextResponse } from 'next/server';
import Terra from 'terra-api';
import { PrismaClient } from '@prisma/client';

const terra = new Terra(
  process.env.TERRA_DEV_ID ?? "",
  process.env.TERRA_API_KEY ?? "",
  process.env.TERRA_WEBHOOK_SECRET ?? ""
);

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('terra-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing Terra signature' }, { status: 400 });
    }

    const data = JSON.parse(body);

    // Store the data in the database using Prisma
    const userId = data.user?.user_id || 'unknown';
    const dataType = data.type || 'unknown';

    await prisma.terraData.create({
      data: {
        userId: userId,
        type: dataType,
        data: JSON.stringify(data),
      },
    });

    return NextResponse.json({ message: 'Webhook received, processed, and stored' }, { status: 200 });
  } catch (error) {
    console.error('Terra Webhook: Failed to process data', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}