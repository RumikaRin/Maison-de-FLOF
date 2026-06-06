import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, phone, email, companyName, projectName, projectType, area, paintType, message } = body;

    if (!fullName || !phone || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find matching user and customer record if exists
    const user = await db.user.findUnique({
      where: { email }
    });

    let customerId: string | undefined = undefined;
    if (user) {
      const customer = await db.customer.findUnique({
        where: { userId: user.id }
      });
      if (customer) {
        customerId = customer.id;
      }
    }

    const created = await db.quoteRequest.create({
      data: {
        customerId,
        fullName,
        phone,
        email,
        companyName,
        projectName,
        projectType: projectType || "Residential",
        area: area ? Number(area) : undefined,
        paintType,
        message
      }
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Failed to submit quote request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
