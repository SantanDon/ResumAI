/**
 * Abstract interface for LLM backends
 * Allows swapping between Ollama, HF Inference, Together AI, etc.
 */

export interface LLMBackend {
    /**
     * Generate text from a prompt
     */
    generate(prompt: string): Promise<string>;

    /**
     * Check if backend is available/connected
     */
    isAvailable(): Promise<boolean>;

    /**
     * Human-readable backend name
     */
    getName(): string;
}
