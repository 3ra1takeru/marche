import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { stripe } from "@/lib/stripe-server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, bookingId, planType } = body

    let priceData: any

    if (type === "subscription") {
      // サブスクリプション決済
      if (planType !== "premium") {
        return NextResponse.json(
          { error: "Invalid plan type" },
          { status: 400 }
        )
      }

      priceData = {
        currency: "jpy",
        unit_amount: 500000, // 5,000円
        recurring: {
          interval: "month",
        },
        product_data: {
          name: "マルシェポータル プレミアムプラン",
          description: "無制限のイベント作成、高度な管理機能、優先サポート",
        },
      }
    } else if (type === "booking") {
      // 予約決済
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          service: true,
          exhibitor: true,
        },
      })

      if (!booking) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        )
      }

      if (booking.userId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      priceData = {
        currency: "jpy",
        unit_amount: booking.totalAmount,
        product_data: {
          name: booking.service?.name || "サービス予約",
          description: `${booking.exhibitor.businessName || booking.exhibitor.name}のサービス`,
        },
      }
    } else {
      return NextResponse.json(
        { error: "Invalid payment type" },
        { status: 400 }
      )
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email,
      payment_method_types: ["card"],
      mode: type === "subscription" ? "subscription" : "payment",
      line_items: [
        {
          price_data: priceData,
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        type: type,
        ...(bookingId && { bookingId }),
        ...(planType && { planType }),
      },
      success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancelled`,
      ...(type === "subscription" && {
        subscription_data: {
          trial_period_days: 60, // 2ヶ月無料
          metadata: {
            userId: session.user.id,
            planType: planType,
          },
        },
      }),
    })

    // 支払い記録を作成
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        bookingId: type === "booking" ? bookingId : null,
        stripePaymentId: checkoutSession.id,
        amount: type === "subscription" ? 500000 : (await prisma.booking.findUnique({ where: { id: bookingId } }))?.totalAmount || 0,
        paymentType: type === "subscription" ? "SUBSCRIPTION" : "BOOKING",
        status: "PENDING",
      },
    })

    return NextResponse.json({ sessionId: checkoutSession.id })
  } catch (error: any) {
    console.error("Checkout session error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}