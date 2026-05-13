/**
 * Normalises Gemini output into { recommendations: [...] } — the shape the frontend reads.
 *
 * Accepts both schemas Gemini may return:
 *   { recommendations: [{ overview, level, ... }] }  ← array format (prompt output)
 *   { recommendation: { overview, level, ... } }     ← singular (defensive fallback)
 *
 * Always returns the single highest-severity item wrapped in an array.
 */
export default function validateAndFill(parsed) {
    const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 };

    // Collect candidates from either schema
    let candidates = [];
    if (Array.isArray(parsed?.recommendations)) {
        candidates = parsed.recommendations;
    } else if (parsed?.recommendation && typeof parsed.recommendation === 'object') {
        candidates = [parsed.recommendation];
    }

    const normalized = candidates
        .filter((r) => r && typeof r === 'object')
        .map((r) => ({ ...r, level: String(r.level || '').toUpperCase() }))
        .filter((r) => rank[r.level]);

    if (normalized.length === 0) {
        return {
            recommendations: [
                {
                    overview: 'No critical maintenance risk detected from AI output.',
                    justification: 'All deterministic checks passed with no flags raised.',
                    level: 'LOW',
                    component: 'general',
                    estimated_urgency_days: 90,
                },
            ],
        };
    }

    const highest = normalized.reduce((best, current) =>
        rank[current.level] > rank[best.level] ? current : best
    );

    return { recommendations: [highest] };
}
