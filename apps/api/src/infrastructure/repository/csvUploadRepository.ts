import { eq } from "drizzle-orm";
import { db } from "@/db";
import { csvUploads } from "@/db/schema";
import { ICsvUploadRepository, CsvUpload } from "@/domain/repository/csvUploadRepository";

export class CsvUploadRepository implements ICsvUploadRepository {
  async create(input: {
    userId: string;
    fileName: string;
    rawData: unknown;
    rowCount: number;
    status: string;
  }): Promise<CsvUpload> {
    const [row] = await db
      .insert(csvUploads)
      .values({
        userId: input.userId,
        fileName: input.fileName,
        rawData: input.rawData,
        rowCount: input.rowCount,
        status: input.status,
      })
      .returning();

    return {
      id: row.id,
      userId: row.userId,
      fileName: row.fileName,
      uploadedAt: row.uploadedAt,
      rawData: row.rawData,
      rowCount: row.rowCount,
      status: row.status,
    };
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await db.update(csvUploads).set({ status }).where(eq(csvUploads.id, id));
  }
}
