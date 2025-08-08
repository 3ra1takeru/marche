"use client"

declare global {
  interface Window {
    liff: any
  }
}

export const initializeLiff = async () => {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID

  if (!liffId) {
    console.warn('LIFF ID not found in environment variables')
    return null
  }

  try {
    await window.liff.init({
      liffId: liffId,
    })

    if (window.liff.isLoggedIn()) {
      return await window.liff.getProfile()
    } else {
      window.liff.login()
      return null
    }
  } catch (error) {
    console.error('LIFF initialization failed:', error)
    return null
  }
}

export const getLiffProfile = async () => {
  try {
    if (window.liff && window.liff.isLoggedIn()) {
      return await window.liff.getProfile()
    }
    return null
  } catch (error) {
    console.error('Failed to get LIFF profile:', error)
    return null
  }
}

export const sendLineMessage = async (message: string) => {
  try {
    if (window.liff && window.liff.isInClient()) {
      await window.liff.sendMessages([
        {
          type: 'text',
          text: message,
        },
      ])
      return true
    }
    return false
  } catch (error) {
    console.error('Failed to send LINE message:', error)
    return false
  }
}

export const shareLiff = async (url: string) => {
  try {
    if (window.liff && window.liff.isApiAvailable('shareTargetPicker')) {
      await window.liff.shareTargetPicker([
        {
          type: 'flex',
          altText: 'マルシェポータル',
          contents: {
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: 'マルシェポータル',
                  weight: 'bold',
                  size: 'xl',
                },
                {
                  type: 'text',
                  text: 'イベント情報をチェック！',
                  size: 'md',
                  color: '#666666',
                  margin: 'md',
                },
              ],
            },
            action: {
              type: 'uri',
              uri: url,
            },
          },
        },
      ])
      return true
    }
    return false
  } catch (error) {
    console.error('Failed to share via LIFF:', error)
    return false
  }
}