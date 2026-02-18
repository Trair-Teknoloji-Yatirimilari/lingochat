import { describe, it, expect } from "vitest";
import { invokeLLM } from "../server/_core/llm";

describe("OpenAI API Integration", () => {
  it("should successfully call OpenAI API with valid key", async () => {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a helpful translation assistant.",
          },
          {
            role: "user",
            content: "Translate 'Hello' to French.",
          },
        ],
      });

      expect(response).toBeDefined();
      expect(response.choices).toBeDefined();
      expect(response.choices.length).toBeGreaterThan(0);
      expect(response.choices[0].message).toBeDefined();
      expect(response.choices[0].message.content).toBeDefined();
      expect(typeof response.choices[0].message.content).toBe("string");
    } catch (error) {
      throw new Error(`OpenAI API call failed: ${error}`);
    }
  });
});
