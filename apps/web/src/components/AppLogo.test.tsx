import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppLogo } from "./AppLogo";

describe("AppLogo", () => {
  describe("基本表示", () => {
    it("¥ アイコンを表示する", () => {
      render(<AppLogo />);
      expect(screen.getByText("¥")).toBeInTheDocument();
    });

    it("PayPay 家計簿テキストを表示する", () => {
      render(<AppLogo />);
      expect(screen.getByText("PayPay 家計簿")).toBeInTheDocument();
    });
  });

  describe("サイズバリアント", () => {
    it("デフォルト(sm)でw-8 h-8クラスが適用される", () => {
      render(<AppLogo />);
      const icon = screen.getByText("¥").parentElement;
      expect(icon?.className).toContain("w-8 h-8");
    });

    it("size=mdでw-10 h-10クラスが適用される", () => {
      render(<AppLogo size="md" />);
      const icon = screen.getByText("¥").parentElement;
      expect(icon?.className).toContain("w-10 h-10");
    });

    it("size=lgでw-12 h-12クラスが適用される", () => {
      render(<AppLogo size="lg" />);
      const icon = screen.getByText("¥").parentElement;
      expect(icon?.className).toContain("w-12 h-12");
    });

    it("size=smでtext-xlのテキストサイズが適用される", () => {
      render(<AppLogo size="sm" />);
      const heading = screen.getByText("PayPay 家計簿");
      expect(heading.className).toContain("text-xl");
    });

    it("size=lgでtext-3xlのテキストサイズが適用される", () => {
      render(<AppLogo size="lg" />);
      const heading = screen.getByText("PayPay 家計簿");
      expect(heading.className).toContain("text-3xl");
    });
  });

  describe("カラーバリアント", () => {
    it("デフォルト(brand)でグラデーション背景が適用される", () => {
      render(<AppLogo />);
      const icon = screen.getByText("¥").parentElement;
      expect(icon?.className).toContain("from-red-500");
      expect(icon?.className).toContain("to-pink-600");
    });

    it("variant=whiteで白背景が適用される", () => {
      render(<AppLogo variant="white" />);
      const icon = screen.getByText("¥").parentElement;
      expect(icon?.className).toContain("bg-white");
    });

    it("variant=whiteでアイコン文字が赤色になる", () => {
      render(<AppLogo variant="white" />);
      const yenText = screen.getByText("¥");
      expect(yenText.className).toContain("text-red-500");
    });

    it("variant=brandでアイコン文字が白色になる", () => {
      render(<AppLogo />);
      const yenText = screen.getByText("¥");
      expect(yenText.className).toContain("text-white");
    });
  });

  describe("className prop", () => {
    it("追加のclassNameが適用される", () => {
      render(<AppLogo className="custom-class" />);
      const container = screen.getByText("¥").parentElement?.parentElement;
      expect(container?.className).toContain("custom-class");
    });
  });
});
