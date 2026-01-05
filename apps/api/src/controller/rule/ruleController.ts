import { Context } from "hono";
import { ListRulesUseCase } from "@/usecase/rule/listRulesUseCase";
import { CreateRuleUseCase } from "@/usecase/rule/createRuleUseCase";
import { UpdateRuleUseCase } from "@/usecase/rule/updateRuleUseCase";
import { DeleteRuleUseCase } from "@/usecase/rule/deleteRuleUseCase";
import { RuleRepository } from "@/infrastructure/repository/ruleRepository";
import { RuleService } from "@/service/rule/ruleService";

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
  async list(c: Context) {
    const user = c.get("user");
    const rules = await this.listUseCase.execute(user.userId);
    return c.json({ data: rules.map((r) => r.toResponse()) }, 200);
  }

  /**
   * ルール作成
   */
  async create(c: Context) {
    const user = c.get("user");
    const body = await c.req.json();
    const rule = await this.createUseCase.execute(user.userId, body);
    return c.json(rule.toResponse(), 201);
  }

  /**
   * ルール更新
   */
  async update(c: Context) {
    const user = c.get("user");
    const id = c.req.param("id");
    const body = await c.req.json();

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
  }

  /**
   * ルール削除
   */
  async delete(c: Context) {
    const user = c.get("user");
    const id = c.req.param("id");

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
  }
}
