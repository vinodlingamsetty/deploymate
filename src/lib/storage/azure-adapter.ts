import {
  BlobSASPermissions,
  BlobServiceClient,
  ContainerClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob'
import type { FileMetadata, SignedUrlOptions, StorageAdapter, UploadResult } from './types'

export class AzureBlobStorageAdapter implements StorageAdapter {
  readonly provider = 'azure-blob' as const
  private readonly containerClient: ContainerClient
  private readonly credential: StorageSharedKeyCredential | null
  private readonly accountName: string

  constructor() {
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME
    if (!containerName) throw new Error('AZURE_STORAGE_CONTAINER_NAME environment variable is required')

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY

    if (connectionString) {
      const serviceClient = BlobServiceClient.fromConnectionString(connectionString)
      this.containerClient = serviceClient.getContainerClient(containerName)
      // Extract credential from connection string for SAS generation
      const nameMatch = connectionString.match(/AccountName=([^;]+)/)
      const keyMatch = connectionString.match(/AccountKey=([^;]+)/)
      if (nameMatch && keyMatch) {
        this.accountName = nameMatch[1]
        this.credential = new StorageSharedKeyCredential(nameMatch[1], keyMatch[1])
      } else {
        this.accountName = ''
        this.credential = null
      }
    } else if (accountName && accountKey) {
      this.accountName = accountName
      this.credential = new StorageSharedKeyCredential(accountName, accountKey)
      const serviceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        this.credential,
      )
      this.containerClient = serviceClient.getContainerClient(containerName)
    } else {
      throw new Error(
        'Either AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME + AZURE_STORAGE_ACCOUNT_KEY are required',
      )
    }
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<UploadResult> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(key)
    await blockBlobClient.upload(data, data.length, {
      blobHTTPHeaders: { blobContentType: contentType },
    })
    return { key, size: data.length }
  }

  async getSignedDownloadUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    return this.generateSasUrl(key, 'r', options)
  }

  async getSignedUploadUrl(key: string, _contentType: string, options?: SignedUrlOptions): Promise<string> {
    return this.generateSasUrl(key, 'cw', options)
  }

  private generateSasUrl(key: string, permissionString: string, options?: SignedUrlOptions): string {
    if (!this.credential) {
      throw new Error('SAS URL generation requires account credentials')
    }

    const blobClient = this.containerClient.getBlobClient(key)
    const expiresOn = new Date(Date.now() + (options?.expiresIn ?? 3600) * 1000)

    const sasParams = generateBlobSASQueryParameters(
      {
        containerName: this.containerClient.containerName,
        blobName: key,
        permissions: BlobSASPermissions.parse(permissionString),
        expiresOn,
        ...(options?.downloadFilename
          ? { contentDisposition: `attachment; filename="${options.downloadFilename}"` }
          : {}),
      },
      this.credential,
    )

    return `${blobClient.url}?${sasParams.toString()}`
  }

  async delete(key: string): Promise<void> {
    const blobClient = this.containerClient.getBlobClient(key)
    await blobClient.deleteIfExists()
  }

  async exists(key: string): Promise<boolean> {
    const blobClient = this.containerClient.getBlobClient(key)
    return blobClient.exists()
  }

  async getBuffer(key: string): Promise<Buffer> {
    const blobClient = this.containerClient.getBlobClient(key)
    return blobClient.downloadToBuffer()
  }

  async getMetadata(key: string): Promise<FileMetadata | null> {
    const blobClient = this.containerClient.getBlobClient(key)
    try {
      const props = await blobClient.getProperties()
      return {
        key,
        size: props.contentLength ?? 0,
        contentType: props.contentType ?? 'application/octet-stream',
        lastModified: props.lastModified ?? new Date(),
      }
    } catch (err) {
      if ((err as { statusCode?: number }).statusCode === 404) return null
      throw err
    }
  }

  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    const sourceBlobClient = this.containerClient.getBlobClient(sourceKey)
    const destBlobClient = this.containerClient.getBlobClient(destinationKey)
    const poller = await destBlobClient.beginCopyFromURL(sourceBlobClient.url)
    await poller.pollUntilDone()
  }

  async list(prefix: string, maxResults?: number): Promise<string[]> {
    const keys: string[] = []
    const iter = this.containerClient.listBlobsFlat({ prefix })

    for await (const blob of iter) {
      keys.push(blob.name)
      if (maxResults !== undefined && keys.length >= maxResults) break
    }

    return keys
  }
}
