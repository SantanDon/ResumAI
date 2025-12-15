import React, { useState } from 'react';
import { puter } from '@heyputer/puter.js';

interface AIEnhancerProps {
    parsedData: {
        rawText: string;
        lines: string[];
        classifications: Record<string, string[]>;
    } | null;
    isPuterAuthenticated: boolean;
}

export const AIEnhancer: React.FC<AIEnhancerProps> = ({ parsedData, isPuterAuthenticated }) => {
    const [enhancedText, setEnhancedText] = useState<string>('');
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');

    const handleEnhance = async () => {
        if (!parsedData || !isPuterAuthenticated) return;

        setIsEnhancing(true);
        setEnhancedText('');

        try {
            // Build atomic prompts following ideology.txt
            const atomicPrompts = [
                `Analyze this CV data and identify the candidate's top 3 strengths:\n${JSON.stringify(parsedData.classifications, null, 2)}`,
                `Based on this CV, suggest 3 improvements for the professional summary:\n${parsedData.rawText.slice(0, 500)}`,
                `Review these skills and suggest 2 additional skills to add:\n${parsedData.classifications.skill.join(', ')}`,
            ];

            // Ensemble voting: run all prompts and aggregate
            const responses = await Promise.all(
                atomicPrompts.map((prompt) =>
                    puter.ai.chat(prompt, { model: selectedModel })
                )
            );

            // Combine responses
            const combined = responses
                .map((r, i) => `**Analysis ${i + 1}:**\n${r}`)
                .join('\n\n');

            setEnhancedText(combined);
        } catch (err) {
            setEnhancedText(`Error: ${err}`);
        } finally {
            setIsEnhancing(false);
        }
    };

    if (!parsedData) return null;

    return (
        <div className="glass-dark rounded-xl p-6 mt-6">
            <h3 className="text-purple-300 font-semibold mb-4">🚀 AI Enhancement (Puter Cloud)</h3>

            <div className="flex gap-3 mb-4">
                <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="flex-1 p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={!isPuterAuthenticated}
                >
                    <option value="gpt-4o">GPT-4o (OpenAI)</option>
                    <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
                </select>

                <button
                    onClick={handleEnhance}
                    disabled={!isPuterAuthenticated || isEnhancing}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isEnhancing ? '🔄 Enhancing...' : '✨ Enhance CV'}
                </button>
            </div>

            {!isPuterAuthenticated && (
                <p className="text-yellow-300 text-sm mb-4">⚠️ Connect Puter AI above to enable cloud enhancement</p>
            )}

            {enhancedText && (
                <div className="bg-black/30 rounded-lg p-4 mt-4">
                    <h4 className="text-white font-medium mb-2">Enhancement Results:</h4>
                    <pre className="text-gray-200 text-sm whitespace-pre-wrap">{enhancedText}</pre>
                </div>
            )}
        </div>
    );
};
