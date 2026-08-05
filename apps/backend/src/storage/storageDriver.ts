export interface StoredFile {
  key: string;
  url: string;
}

export interface SaveFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folder: string;
}

export interface StorageDriver {
  save(input: SaveFileInput): Promise<StoredFile>;
  delete(key: string): Promise<void>;
  read(key: string): Promise<Buffer>;
}
