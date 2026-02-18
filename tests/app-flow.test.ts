import { describe, it, expect } from "vitest";
import { invokeLLM } from "../server/_core/llm";

describe("LingoChat App Flow", () => {
  it("should translate messages from Turkish to English", async () => {
    const turkishMessage = "Merhaba, nasılsın?";
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a professional translator. Translate the following text from Turkish to English. Return ONLY the translated text, nothing else.",
        },
        {
          role: "user",
          content: turkishMessage,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const translatedText = typeof content === 'string' ? content : '';
    expect(typeof translatedText).toBe("string");
    expect(translatedText).toBeTruthy();
    // Should contain English words
    expect(translatedText.toLowerCase()).toMatch(/hello|hi|how/i);
  });

  it("should translate messages from English to Spanish", async () => {
    const englishMessage = "Hello, how are you?";
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a professional translator. Translate the following text from English to Spanish. Return ONLY the translated text, nothing else.",
        },
        {
          role: "user",
          content: englishMessage,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const translatedText = typeof content === 'string' ? content : '';
    expect(typeof translatedText).toBe("string");
    expect(translatedText).toBeTruthy();
  });
});
