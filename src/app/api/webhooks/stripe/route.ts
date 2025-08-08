import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe-server"
import { prisma } from "@/lib/db"
import { savePaymentToSheets } from "@/lib/google-sheets"
import Stripe from "stripe"

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get("Stripe-Signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { metadata } = session
  
  if (!metadata?.userId) {
    console.error("No userId in session metadata")
    return
  }

  // 支払い記録を更新
  const payment = await prisma.payment.findFirst({
    where: {
      stripePaymentId: session.id,
      status: "PENDING",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (payment) {
    await prisma.payment.updateMany({
      where: {
        stripePaymentId: session.id,
        status: "PENDING",
      },
      data: {
        status: "SUCCESS",
      },
    })

    // Google Sheetsに決済情報を保存（非同期で実行）
    savePaymentToSheets({
      userName: payment.user.name,
      userEmail: payment.user.email,
      paymentType: payment.paymentType,
      amount: payment.amount,
      status: "SUCCESS",
      stripePaymentId: session.id,
      paidAt: new Date().toISOString(),
    }).catch(error => {
      console.error('Failed to save payment to Google Sheets:', error)
    })
  }

  if (metadata.type === "subscription") {
    // プレミアムプランへアップグレード
    const subscriptionEndDate = new Date()
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 3) // トライアル含む3ヶ月

    await prisma.user.update({
      where: { id: metadata.userId },
      data: {
        membershipType: "PREMIUM",
        membershipStart: new Date(),
        membershipEnd: subscriptionEndDate,
      },
    })
  } else if (metadata.type === "booking" && metadata.bookingId) {
    // 予約を確定
    await prisma.booking.update({
      where: { id: metadata.bookingId },
      data: {
        status: "CONFIRMED",
        paymentMethod: "CREDIT_CARD",
      },
    })
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    )
    
    if (subscription.metadata?.userId) {
      // サブスクリプション期間を更新
      const nextBillingDate = new Date(subscription.current_period_end * 1000)
      
      await prisma.user.update({
        where: { id: subscription.metadata.userId },
        data: {
          membershipEnd: nextBillingDate,
        },
      })
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  if (subscription.metadata?.userId) {
    // プレミアムプランを無料プランに戻す
    await prisma.user.update({
      where: { id: subscription.metadata.userId },
      data: {
        membershipType: "FREE",
        membershipEnd: null,
      },
    })
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // 支払い失敗の処理（必要に応じて実装）
  console.log("Payment failed for invoice:", invoice.id)
}