import { RouteHandler } from "@hono/zod-openapi";
import { ListRulesUseCase } from "@/usecase/rule/listRulesUseCase";
import { CreateRuleUseCase } from "@/usecase/rule/createRuleUseCase";
import { UpdateRuleUseCase } from "@/usecase/rule/updateRuleUseCase";
import { DeleteRuleUseCase } from "@/usecase/rule/deleteRuleUseCase";
import { RuleRepository } from "@/infrastructure/repository/ruleRepository";
import { RuleService } from "@/service/rule/ruleService";
import { Env } from "@/types/hono";
import { GetRulesRoute, CreateRuleRoute, UpdateRuleRoute, DeleteRuleRoute } from "./rule.routes";

/**
 * Rule Controller
 * ルールのHTTPリクエストを処理
 */
export class RuleController {
  private readonly listUseCase: ListRulesUseCase;
  private readonly createUseCase: CreateRuleUseCase;
  private readonly updateUseCase: UpdateRuleUseCase;
  private readonly deleteUseCase: DeleteRuleUseCase;

  constructor() {
    const repository = new RuleRepository();
    const service = new RuleService(repository);
    this.listUseCase = new ListRulesUseCase(repository);
    this.createUseCase = new CreateRuleUseCase(repository);
    this.updateUseCase = new UpdateRuleUseCase(repository, service);
    this.deleteUseCase = new DeleteRuleUseCase(repository, service);
  }

  /**
   * ルール一覧取得
   */
  list: RouteHandler<GetRulesRoute, Env> = async (c) => {
    const user = c.get("user");
    const rules = await this.listUseCase.execute(user.userId);
    return c.json({ data: rules.map((r) => r.toResponse()) }, 200);
  };

  /**
   * ルール作成
   */
  create: RouteHandler<CreateRuleRoute, Env> = async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");
    const rule = await this.createUseCase.execute(user.userId, body);
    return c.json(rule.toResponse(), 201);
  };

  /**
   * ルール更新
   */
  update: RouteHandler<UpdateRuleRoute, Env> = async (c) => {
    const user = c.get("user");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    try {
      const rule = await this.updateUseCase.execute(id, user.userId, body);
      return c.json(rule.toResponse(), 200);
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

  /**
   * ルール削除
   */
  delete: RouteHandler<DeleteRuleRoute, Env> = async (c) => {
    const user = c.get("user");
    const { id } = c.req.valid("param");

    try {
      await this.deleteUseCase.execute(id, user.userId);
      return c.json({ message: "Rule deleted successfully" }, 200);
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
