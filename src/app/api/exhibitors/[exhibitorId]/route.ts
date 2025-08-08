import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { exhibitorId: string } }
) {
  try {
    const exhibitor = await prisma.exhibitor.findUnique({
      where: {
        id: params.exhibitorId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            location: true,
            prefecture: true,
          },
        },
        products: true,
        services: true,
      },
    })

    if (!exhibitor) {
      return NextResponse.json({ error: "Exhibitor not found" }, { status: 404 })
    }

    return NextResponse.json(exhibitor)
  } catch (error) {
    console.error("Get exhibitor error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}