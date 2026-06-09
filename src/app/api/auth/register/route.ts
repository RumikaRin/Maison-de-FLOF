import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const customerRole = await db.role.findUnique({ where: { type: "CUSTOMER" } });
    if (!customerRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 500 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId: customerRole.id,
        customer: {
          create: { customerType: "RETAIL" },
        },
      },
    });

    return NextResponse.json({ success: true, email: user.email }, { status: 201 });
  } catch (error) {
    console.error("Register failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
