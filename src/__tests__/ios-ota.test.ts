import { describe, expect, it } from 'vitest'

import { getIosOtaWarning } from '@/lib/ios-ota'

describe('getIosOtaWarning', () => {
  it('returns no warning for Android builds', () => {
    expect(getIosOtaWarning('ANDROID', null)).toBeNull()
  })

  it('warns for App Store signed iOS builds', () => {
    expect(getIosOtaWarning('IOS', 'appstore')).toContain('cannot be installed over-the-air')
  })

  it('warns when iOS signing info is missing', () => {
    expect(getIosOtaWarning('IOS', null)).toContain('Signing profile was not detected')
  })

  it('returns no warning for supported iOS signing types', () => {
    expect(getIosOtaWarning('IOS', 'adhoc')).toBeNull()
    expect(getIosOtaWarning('IOS', 'enterprise')).toBeNull()
  })
})

