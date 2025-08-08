import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { stripe } from "@/lib/stripe-server"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      )
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkoutSession.customer_email !== session.user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      id: checkoutSession.id,
      payment_status: checkoutSession.payment_status,
      amount_total: checkoutSession.amount_total,
      currency: checkoutSession.currency,
      created: checkoutSession.created,
      metadata: checkoutSession.metadata,
    })
  } catch (error: any) {
    console.error("Verify payment error:", error)
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    )
  }
}