"use client"

import { useState, useEffect } from 'react'

interface LiffProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

export function useLiff() {
  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null)
  const [isLiffReady, setIsLiffReady] = useState(false)
  const [isInLiff, setIsInLiff] = useState(false)

  useEffect(() => {
    const initLiff = async () => {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID

      if (!liffId) {
        console.warn('LIFF ID not found')
        return
      }

      // LIFF SDKを動的に読み込み
      if (!window.liff) {
        const script = document.createElement('script')
        script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
        script.onload = () => initializeLiff(liffId)
        document.head.appendChild(script)
      } else {
        await initializeLiff(liffId)
      }
    }

    const initializeLiff = async (liffId: string) => {
      try {
        await window.liff.init({ liffId })
        setIsLiffReady(true)
        setIsInLiff(window.liff.isInClient())

        if (window.liff.isLoggedIn()) {
          const profile = await window.liff.getProfile()
          setLiffProfile(profile)
        }
      } catch (error) {
        console.error('LIFF initialization failed:', error)
      }
    }

    initLiff()
  }, [])

  const loginWithLine = () => {
    if (window.liff && isLiffReady) {
      window.liff.login()
    }
  }

  const logoutFromLine = () => {
    if (window.liff && isLiffReady) {
      window.liff.logout()
      setLiffProfile(null)
    }
  }

  const sendMessage = async (message: string) => {
    if (window.liff && isInLiff) {
      try {
        await window.liff.sendMessages([
          {
            type: 'text',
            text: message,
          },
        ])
        return true
      } catch (error) {
        console.error('Failed to send message:', error)
        return false
      }
    }
    return false
  }

  const shareContent = async (url: string, title: string, description?: string) => {
    if (window.liff && isLiffReady) {
      try {
        await window.liff.shareTargetPicker([
          {
            type: 'flex',
            altText: title,
            contents: {
              type: 'bubble',
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: title,
                    weight: 'bold',
                    size: 'xl',
                  },
                  ...(description
                    ? [
                        {
                          type: 'text',
                          text: description,
                          size: 'md',
                          color: '#666666',
                          margin: 'md',
                          wrap: true,
                        },
                      ]
                    : []),
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
      } catch (error) {
        console.error('Failed to share content:', error)
        return false
      }
    }
    return false
  }

  const closeWindow = () => {
    if (window.liff && isInLiff) {
      window.liff.closeWindow()
    }
  }

  return {
    liffProfile,
    isLiffReady,
    isInLiff,
    loginWithLine,
    logoutFromLine,
    sendMessage,
    shareContent,
    closeWindow,
  }
}