export interface CsvUpload {
  id: string;
  userId: string;
  fileName: string;
  uploadedAt: Date;
  rawData: unknown;
  rowCount: number;
  status: string;
}

export interface ICsvUploadRepository {
  create(input: {
    userId: string;
    fileName: string;
    rawData: unknown;
    rowCount: number;
    status: string;
  }): Promise<CsvUpload>;

  updateStatus(id: string, status: string): Promise<void>;
}
