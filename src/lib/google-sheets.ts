import { JWT } from 'google-auth-library'
import { GoogleSpreadsheet } from 'google-spreadsheet'

// サービスアカウントの認証情報
const CREDENTIALS = {
  client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

const SPREADSHEET_ID = process.env.SPREADSHEET_ID

// Google Sheets APIクライアントを初期化
export async function getGoogleSheetsClient() {
  try {
    const serviceAccountAuth = new JWT({
      email: CREDENTIALS.client_email,
      key: CREDENTIALS.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID!, serviceAccountAuth)
    await doc.loadInfo()
    
    return doc
  } catch (error) {
    console.error('Google Sheets client initialization failed:', error)
    throw error
  }
}

// ユーザー情報をスプレッドシートに保存
export async function saveUserToSheets(userData: {
  name: string
  email: string
  phoneNumber?: string
  prefecture?: string
  birthDate?: string
  membershipType: string
  registeredAt: string
}) {
  try {
    const doc = await getGoogleSheetsClient()
    
    // "Users" シートを取得または作成
    let userSheet = doc.sheetsByTitle['Users']
    if (!userSheet) {
      userSheet = await doc.addSheet({
        title: 'Users',
        headerValues: [
          'Name',
          'Email',
          'Phone',
          'Prefecture',
          'Birth Date',
          'Membership Type',
          'Registered At'
        ]
      })
    }

    // ユーザーデータを追加
    await userSheet.addRow({
      'Name': userData.name,
      'Email': userData.email,
      'Phone': userData.phoneNumber || '',
      'Prefecture': userData.prefecture || '',
      'Birth Date': userData.birthDate || '',
      'Membership Type': userData.membershipType,
      'Registered At': userData.registeredAt,
    })

    console.log('User data saved to Google Sheets:', userData.email)
  } catch (error) {
    console.error('Failed to save user to Google Sheets:', error)
    // エラーが発生してもサービスは継続
  }
}

// イベント申し込み情報をスプレッドシートに保存
export async function saveEventRegistrationToSheets(registrationData: {
  eventTitle: string
  eventDate: string
  userName: string
  userEmail: string
  exhibitorName: string
  businessName?: string
  category: string
  introduction: string
  snsLinks: any
  registeredAt: string
}) {
  try {
    const doc = await getGoogleSheetsClient()
    
    // "Event Registrations" シートを取得または作成
    let registrationSheet = doc.sheetsByTitle['Event Registrations']
    if (!registrationSheet) {
      registrationSheet = await doc.addSheet({
        title: 'Event Registrations',
        headerValues: [
          'Event Title',
          'Event Date',
          'User Name',
          'User Email',
          'Exhibitor Name',
          'Business Name',
          'Category',
          'Introduction',
          'Instagram',
          'Twitter',
          'Website',
          'Registered At'
        ]
      })
    }

    // 申し込みデータを追加
    await registrationSheet.addRow({
      'Event Title': registrationData.eventTitle,
      'Event Date': registrationData.eventDate,
      'User Name': registrationData.userName,
      'User Email': registrationData.userEmail,
      'Exhibitor Name': registrationData.exhibitorName,
      'Business Name': registrationData.businessName || '',
      'Category': registrationData.category,
      'Introduction': registrationData.introduction,
      'Instagram': registrationData.snsLinks?.instagram || '',
      'Twitter': registrationData.snsLinks?.twitter || '',
      'Website': registrationData.snsLinks?.website || '',
      'Registered At': registrationData.registeredAt,
    })

    console.log('Event registration saved to Google Sheets:', registrationData.userEmail)
  } catch (error) {
    console.error('Failed to save event registration to Google Sheets:', error)
    // エラーが発生してもサービスは継続
  }
}

// 決済情報をスプレッドシートに保存
export async function savePaymentToSheets(paymentData: {
  userName: string
  userEmail: string
  paymentType: string
  amount: number
  status: string
  stripePaymentId?: string
  paidAt: string
}) {
  try {
    const doc = await getGoogleSheetsClient()
    
    // "Payments" シートを取得または作成
    let paymentSheet = doc.sheetsByTitle['Payments']
    if (!paymentSheet) {
      paymentSheet = await doc.addSheet({
        title: 'Payments',
        headerValues: [
          'User Name',
          'User Email',
          'Payment Type',
          'Amount (JPY)',
          'Status',
          'Stripe Payment ID',
          'Paid At'
        ]
      })
    }

    // 決済データを追加
    await paymentSheet.addRow({
      'User Name': paymentData.userName,
      'User Email': paymentData.userEmail,
      'Payment Type': paymentData.paymentType === 'SUBSCRIPTION' ? 'サブスクリプション' : '単発決済',
      'Amount (JPY)': paymentData.amount,
      'Status': paymentData.status === 'SUCCESS' ? '成功' : paymentData.status === 'PENDING' ? '処理中' : '失敗',
      'Stripe Payment ID': paymentData.stripePaymentId || '',
      'Paid At': paymentData.paidAt,
    })

    console.log('Payment data saved to Google Sheets:', paymentData.userEmail)
  } catch (error) {
    console.error('Failed to save payment to Google Sheets:', error)
    // エラーが発生してもサービスは継続
  }
}