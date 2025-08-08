import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { addMinutes, format, parseISO, isAfter, isBefore } from "date-fns"

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get("serviceId")

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      )
    }

    // サービスと関連情報を取得
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        exhibitor: {
          include: {
            event: true,
          },
        },
        bookings: {
          where: {
            status: { not: "CANCELLED" },
          },
          select: {
            startTime: true,
            endTime: true,
          },
        },
      },
    })

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    const event = service.exhibitor.event
    const serviceDuration = service.duration
    const intervalTime = service.exhibitor.intervalTime || 0

    // イベントの開始・終了時間
    const eventStart = event.startDate
    const eventEnd = event.endDate

    // 営業時間を設定（例：9:00-18:00）
    const businessStartHour = 9
    const businessEndHour = 18

    // 利用可能なスロットを生成
    const availableSlots: string[] = []
    const slotDuration = serviceDuration + intervalTime // サービス時間 + インターバル

    let currentSlot = new Date(eventStart)
    currentSlot.setHours(businessStartHour, 0, 0, 0)

    const eventEndWithBusinessHours = new Date(eventEnd)
    eventEndWithBusinessHours.setHours(businessEndHour, 0, 0, 0)

    while (isBefore(currentSlot, eventEndWithBusinessHours)) {
      const slotEnd = addMinutes(currentSlot, serviceDuration)
      
      // スロット終了時間が営業時間内かチェック
      if (
        slotEnd.getHours() < businessEndHour ||
        (slotEnd.getHours() === businessEndHour && slotEnd.getMinutes() === 0)
      ) {
        // 予約済みの時間と重複しないかチェック
        const isAvailable = !service.bookings.some((booking) => {
          return (
            (isAfter(currentSlot, booking.startTime) && isBefore(currentSlot, booking.endTime)) ||
            (isAfter(slotEnd, booking.startTime) && isBefore(slotEnd, booking.endTime)) ||
            (isBefore(currentSlot, booking.startTime) && isAfter(slotEnd, booking.endTime)) ||
            (currentSlot.getTime() === booking.startTime.getTime())
          )
        })

        // 現在時刻より後の時間のみ追加
        if (isAvailable && isAfter(currentSlot, new Date())) {
          availableSlots.push(currentSlot.toISOString())
        }
      }

      // 次のスロット（30分間隔で生成）
      currentSlot = addMinutes(currentSlot, 30)
    }

    return NextResponse.json(availableSlots)
  } catch (error) {
    console.error("Get available slots error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}