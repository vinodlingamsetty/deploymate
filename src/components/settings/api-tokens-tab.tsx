'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Key } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ApiToken {
  id: string
  name: string
  tokenPrefix: string
  permissions: string[]
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export function ApiTokensTab() {
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [loading, setLoading] = useState(true)

  // Generate form state
  const [tokenName, setTokenName] = useState('')
  const [accessLevel, setAccessLevel] = useState<'read' | 'readwrite'>('read')
  const [generating, setGenerating] = useState(false)
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Revoke dialog state
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<ApiToken | null>(null)
  const [revoking, setRevoking] = useState(false)

  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/tokens')
      if (res.ok) {
        const json = await res.json() as { data: ApiToken[] }
        setTokens(json.data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  async function handleGenerate() {
    if (!tokenName.trim()) return
    setGenerating(true)
    setGeneratedToken(null)
    try {
      const permissions = accessLevel === 'readwrite' ? ['READ', 'WRITE'] : ['READ']
      const res = await fetch('/api/v1/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tokenName.trim(), permissions }),
      })
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } }
        throw new Error(json.error?.message ?? 'Failed to generate token')
      }
      const json = await res.json() as { data: ApiToken & { token: string } }
      setGeneratedToken(json.data.token)
      setTokenName('')
      setAccessLevel('read')
      await fetchTokens()
      toast.success('API token generated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate token')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopy() {
    if (!generatedToken) return
    await navigator.clipboard.writeText(generatedToken)
    setCopied(true)
    toast.success('Token copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRevoke() {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      const res = await fetch(`/api/v1/tokens/${revokeTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } }
        throw new Error(json.error?.message ?? 'Failed to revoke token')
      }
      setTokens((prev) => prev.filter((t) => t.id !== revokeTarget.id))
      toast.success('Token revoked')
      setRevokeDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke token')
    } finally {
      setRevoking(false)
    }
  }

  function getAccessLabel(permissions: string[]): string {
    if (permissions.includes('WRITE')) return 'Read & Write'
    return 'Read Only'
  }

  return (
    <>
      <div className="space-y-8">
        {/* Generate new token */}
        <div className="max-w-lg space-y-4">
          <h2 className="text-lg font-semibold">Generate New Token</h2>

          <div className="space-y-2">
            <Label htmlFor="token-name">Token Name</Label>
            <Input
              id="token-name"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              maxLength={100}
              placeholder="e.g. CI/CD Pipeline"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="token-access">Access Level</Label>
            <Select
              value={accessLevel}
              onValueChange={(val) => setAccessLevel(val as 'read' | 'readwrite')}
            >
              <SelectTrigger id="token-access">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">Read Only</SelectItem>
                <SelectItem value="readwrite">Read & Write</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            disabled={!tokenName.trim() || generating}
            style={{ backgroundColor: '#0077b6' }}
            onClick={handleGenerate}
          >
            {generating ? 'Generating...' : 'Generate Token'}
          </Button>

          {/* Show generated token once */}
          {generatedToken && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
              <p className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                Copy this token now. You won&apos;t be able to see it again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded bg-white px-3 py-2 font-mono text-xs dark:bg-gray-900">
                  {generatedToken}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  aria-label="Copy token to clipboard"
                >
                  {copied ? (
                    <Check className="size-4 text-green-600" aria-hidden="true" />
                  ) : (
                    <Copy className="size-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Existing tokens */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Existing Tokens</h2>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading tokens...</p>
          ) : tokens.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No API tokens yet. Generate one above to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <Key className="size-5 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{token.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <code className="font-mono text-xs text-muted-foreground">
                          {token.tokenPrefix}...
                        </code>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            token.permissions.includes('WRITE')
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {getAccessLabel(token.permissions)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Created {new Date(token.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setRevokeTarget(token)
                      setRevokeDialogOpen(true)
                    }}
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revoke confirmation dialog */}
      <Dialog
        open={revokeDialogOpen}
        onOpenChange={(open) => {
          if (!open) setRevokeDialogOpen(false)
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Revoke Token</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke{' '}
              <strong>{revokeTarget?.name}</strong>? Any applications using this
              token will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={revoking}
              onClick={handleRevoke}
            >
              {revoking ? 'Revoking...' : 'Revoke Token'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
