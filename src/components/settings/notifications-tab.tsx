'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const STORAGE_KEY = 'deploymate_notification_prefs'

interface NotificationPrefs {
  newRelease: boolean
  downloadAlerts: boolean
  feedback: boolean
  weeklyDigest: boolean
}

const DEFAULT_PREFS: NotificationPrefs = {
  newRelease: true,
  downloadAlerts: false,
  feedback: true,
  weeklyDigest: false,
}

function loadPrefs(): NotificationPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored) as NotificationPrefs
  } catch {
    // ignore malformed data
  }
  return DEFAULT_PREFS
}

export function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setPrefs(loadPrefs())
    setLoaded(true)
  }, [])

  function toggle(key: keyof NotificationPrefs) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    toast.success('Notification preferences saved')
  }

  if (!loaded) return null

  const items: Array<{ key: keyof NotificationPrefs; label: string; description: string }> = [
    {
      key: 'newRelease',
      label: 'New Release',
      description: 'Get notified when a new release is published to a group you belong to.',
    },
    {
      key: 'downloadAlerts',
      label: 'Download Alerts',
      description: 'Get notified when someone downloads a release you uploaded.',
    },
    {
      key: 'feedback',
      label: 'Feedback',
      description: 'Get notified when a tester leaves feedback on your releases.',
    },
    {
      key: 'weeklyDigest',
      label: 'Weekly Digest',
      description: 'Receive a weekly summary of activity across your organizations.',
    },
  ]

  return (
    <div className="max-w-lg space-y-6">
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-start justify-between gap-4 rounded-lg border p-4"
          >
            <div className="space-y-0.5">
              <Label htmlFor={`notif-${item.key}`} className="text-sm font-medium">
                {item.label}
              </Label>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              id={`notif-${item.key}`}
              checked={prefs[item.key]}
              onCheckedChange={() => toggle(item.key)}
            />
          </div>
        ))}
      </div>

      <Button style={{ backgroundColor: '#0077b6' }} onClick={handleSave}>
        Save Preferences
      </Button>
    </div>
  )
}
