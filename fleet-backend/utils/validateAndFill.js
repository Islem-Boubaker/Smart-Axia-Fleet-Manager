export default function validateAndFill(parsed) {
    const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const recommendations = Array.isArray(parsed?.recommendations)
        ? parsed.recommendations
        : [];

    const normalized = recommendations
        .filter((r) => r && typeof r === 'object')
        .map((r) => ({
            ...r,
            level: String(r.level || '').toUpperCase(),
        }))
        .filter((r) => rank[r.level]);

    if (normalized.length === 0) {
        return {
            recommendations: [
                {
                    overview: 'No critical maintenance risk detected from AI output.',
                    level: 'LOW',
                },
            ],
        };
    }

    const highest = normalized.reduce((best, current) => {
        return rank[current.level] > rank[best.level] ? current : best;
    });

    return { recommendations: [highest] };
}