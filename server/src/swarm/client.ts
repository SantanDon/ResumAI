import ollama from 'ollama';

export class SwarmClient {
    private model: string;

    constructor(model: string = 'llama3.2:1b') {
        this.model = model;
    }

    async generate(prompt: string): Promise<string> {
        try {
            const response = await ollama.generate({
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.7, // Slightly creative but stable
                }
            });
            return response.response.trim();
        } catch (error: any) {
            if (error.cause && error.cause.code === 'ECONNREFUSED') {
                console.error("❌ CRITICAL: Could not connect to Ollama!");
                console.error("   Please ensure Ollama is running: 'ollama serve'");
                throw new Error("Ollama connection failed. Is 'ollama serve' running?");
            }
            console.error("Swarm Worker Error:", error);
            throw error;
        }
    }
}
