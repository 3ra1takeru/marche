import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { saveUserToSheets } from "@/lib/google-sheets"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, phoneNumber, prefecture, birthDate, membershipType } = body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "このメールアドレスは既に登録されています" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phoneNumber: phoneNumber || null,
        prefecture: prefecture || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        membershipType: membershipType || "FREE",
        membershipStart: membershipType === "PREMIUM" ? new Date() : null,
        membershipEnd: membershipType === "PREMIUM" 
          ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 2 months free
          : null,
      },
    })

    // Google Sheetsに保存（非同期で実行、エラーでもサービスは継続）
    saveUserToSheets({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || undefined,
      prefecture: user.prefecture || undefined,
      birthDate: user.birthDate ? user.birthDate.toISOString().split('T')[0] : undefined,
      membershipType: user.membershipType,
      registeredAt: user.createdAt.toISOString(),
    }).catch(error => {
      console.error('Failed to save user to Google Sheets:', error)
    })

    return NextResponse.json(
      { message: "アカウントが作成されました", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { message: "アカウントの作成に失敗しました" },
      { status: 500 }
    )
  }
}