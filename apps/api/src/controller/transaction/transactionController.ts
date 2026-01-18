import { RouteHandler } from "@hono/zod-openapi";
import { ListTransactionsUseCase } from "@/usecase/transaction/listTransactionsUseCase";
import { GetTransactionSummaryUseCase } from "@/usecase/transaction/getTransactionSummaryUseCase";
import { UpdateTransactionUseCase } from "@/usecase/transaction/updateTransactionUseCase";
import { ReCategorizeTransactionsUseCase } from "@/usecase/transaction/reCategorizeTransactionsUseCase";
import { GetAvailableYearsUseCase } from "@/usecase/transaction/getAvailableYearsUseCase";
import { UploadCsvUseCase } from "@/usecase/transaction/uploadCsvUseCase";
import { CreateTransactionUseCase } from "@/usecase/transaction/createTransaction.usecase";
import { DeleteTransactionUseCase } from "@/usecase/transaction/deleteTransactionUseCase";
import { ITransactionRepository } from "@/domain/repository/transactionRepository";
import { ICsvUploadRepository } from "@/domain/repository/csvUploadRepository";
import { TransactionService } from "@/service/transaction/transactionService";
import { CsvService } from "@/service/transaction/csvService";
import { IRuleRepository } from "@/domain/repository/ruleRepository";
import { ICategoryRepository } from "@/domain/repository/categoryRepository";
import { Env } from "@/types/hono";
import {
  ListTransactionsRoute,
  GetSummaryRoute,
  UpdateTransactionRoute,
  ReCategorizeRoute,
  GetAvailableYearsRoute,
  UploadCsvRoute,
  CreateTransactionRoute,
  DeleteTransactionRoute,
} from "./transaction.routes";

export class TransactionController {
  constructor(
    private transactionRepository: ITransactionRepository,
    private csvUploadRepository: ICsvUploadRepository,
    private ruleRepository: IRuleRepository,
    private categoryRepository: ICategoryRepository
  ) {}

  private getTransactionService() {
    return new TransactionService(this.transactionRepository);
  }

  private getCsvService() {
    return new CsvService(this.ruleRepository, this.categoryRepository);
  }

  list: RouteHandler<ListTransactionsRoute, Env> = async (c) => {
    const user = c.get("user");
    const query = c.req.valid("query");
    const useCase = new ListTransactionsUseCase(this.transactionRepository);
    const result = await useCase.execute(user.userId, query);
    return c.json(result, 200);
  };

  getSummary: RouteHandler<GetSummaryRoute, Env> = async (c) => {
    const user = c.get("user");
    const query = c.req.valid("query");
    const useCase = new GetTransactionSummaryUseCase(this.transactionRepository, this.getTransactionService());
    const result = await useCase.execute({
      userId: user.userId,
      year: parseInt(query.year, 10),
      month: query.month ? parseInt(query.month, 10) : undefined,
    });
    return c.json(result, 200);
  };

  update: RouteHandler<UpdateTransactionRoute, Env> = async (c) => {
    const user = c.get("user");
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    const useCase = new UpdateTransactionUseCase(this.transactionRepository, this.getTransactionService());
    try {
      const result = await useCase.execute(id, user.userId, input);
      return c.json(result, 200);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("not found")) {
        return c.json({ error: errorMessage }, 404);
      }
      if (errorMessage.includes("Forbidden")) {
        return c.json({ error: errorMessage }, 403);
      }
      throw error;
    }
  };

  reCategorize: RouteHandler<ReCategorizeRoute, Env> = async (c) => {
    const user = c.get("user");
    const input = c.req.valid("json");
    const useCase = new ReCategorizeTransactionsUseCase(this.transactionRepository);
    const result = await useCase.execute({
      userId: user.userId,
      year: input.year,
      month: input.month,
    });
    return c.json(result, 200);
  };

  getAvailableYears: RouteHandler<GetAvailableYearsRoute, Env> = async (c) => {
    const user = c.get("user");
    const useCase = new GetAvailableYearsUseCase(this.transactionRepository);
    const result = await useCase.execute(user.userId);
    return c.json(result, 200);
  };

  uploadCsv: RouteHandler<UploadCsvRoute, Env> = async (c) => {
    const user = c.get("user");
    try {
      const formData = await c.req.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        return c.json({ error: "No file provided" }, 400);
      }

      if (!file.name.endsWith(".csv")) {
        return c.json({ error: "Only CSV files are allowed" }, 400);
      }

      const csvContent = await file.text();
      const useCase = new UploadCsvUseCase(this.transactionRepository, this.csvUploadRepository, this.getCsvService());
      const result = await useCase.execute({
        userId: user.userId,
        fileName: file.name,
        csvContent,
      });

      return c.json(
        {
          message: "CSV uploaded successfully",
          processedCount: result.importedRows,
          categorizedCount: result.importedRows,
          uncategorizedCount: 0,
        },
        201
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return c.json({ error: errorMessage }, 400);
    }
  };

  create: RouteHandler<CreateTransactionRoute, Env> = async (c) => {
    const user = c.get("user");
    const input = c.req.valid("json");
    const useCase = new CreateTransactionUseCase(this.transactionRepository, this.categoryRepository);
    const result = await useCase.execute(user.userId, input);
    return c.json(result, 201);
  };

  delete: RouteHandler<DeleteTransactionRoute, Env> = async (c) => {
    const user = c.get("user");
    const { id } = c.req.valid("param");
    const useCase = new DeleteTransactionUseCase(this.transactionRepository, this.getTransactionService());
    try {
      await useCase.execute(id, user.userId);
      return c.body(null, 204);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("not found")) {
        return c.json({ error: errorMessage }, 404);
      }
      if (errorMessage.includes("Forbidden")) {
        return c.json({ error: errorMessage }, 403);
      }
      throw error;
    }
  };
}
