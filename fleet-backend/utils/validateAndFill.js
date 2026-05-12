/**
 * Normalises Gemini output into a canonical { recommendation: {...} } shape.
 *
 * Handles two schemas that Gemini may return:
 *   { recommendation: { overview, level, ... } }   ← new prompt format
 *   { recommendations: [{ overview, level }, ...] } ← old prompt format
 *
 * Returns the highest-severity recommendation in the new singular form.
 */
export default function validateAndFill(parsed) {
    const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 };

    // Collect candidates from either schema
    let candidates = [];
    if (parsed?.recommendation && typeof parsed.recommendation === 'object') {
        candidates = [parsed.recommendation];
    } else if (Array.isArray(parsed?.recommendations)) {
        candidates = parsed.recommendations;
    }

    const normalized = candidates
        .filter((r) => r && typeof r === 'object')
        .map((r) => ({ ...r, level: String(r.level || '').toUpperCase() }))
        .filter((r) => rank[r.level]);

    if (normalized.length === 0) {
        return {
            recommendation: {
                overview: 'No critical maintenance risk detected from AI output.',
                justification: 'All deterministic checks passed with no flags raised.',
                level: 'LOW',
                component: 'general',
                estimated_urgency_days: 90,
            },
        };
    }

    const highest = normalized.reduce((best, current) =>
        rank[current.level] > rank[best.level] ? current : best
    );

    return { recommendation: highest };
}
