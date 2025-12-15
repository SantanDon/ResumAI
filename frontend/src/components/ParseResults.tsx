import React from 'react';

interface ParseResultsProps {
    data: {
        rawText: string;
        lines: string[];
        classifications: Record<string, string[]>;
    } | null;
}

export const ParseResults: React.FC<ParseResultsProps> = ({ data }) => {
    if (!data) {
        return null;
    }

    const { classifications } = data;

    return (
        <div className="glass-dark rounded-xl p-6 mt-6">
            <h3 className="text-purple-300 font-semibold mb-4">Parsing Results</h3>
            <div className="space-y-3">
                {Object.entries(classifications).map(([type, items]) => (
                    <div key={type}>
                        <h4 className="text-gray-200 font-medium capitalize">{type}</h4>
                        {items.length > 0 ? (
                            <ul className="list-disc list-inside text-gray-100">
                                {items.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400 italic">No {type}s found.</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
