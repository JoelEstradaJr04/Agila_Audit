// ============================================================================
// LLM ANALYSIS SERVICE
// Uses Google Gemini API to generate intelligent anomaly explanations
// ============================================================================

import { DetectedAnomaly, LLMAnalysisResult, AnomalySeverity } from '../types/anomaly';

// Check if Gemini API key is configured
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const LLM_ENABLED = !!GEMINI_API_KEY;

/**
 * Analyze an anomaly using LLM (Gemini)
 * Falls back to rule-based explanation if LLM is not configured or fails
 */
export async function analyzeWithLLM(anomaly: DetectedAnomaly): Promise<LLMAnalysisResult> {
    // If LLM is not configured, use fallback
    if (!LLM_ENABLED) {
        console.log('ℹ️ LLM not configured, using fallback explanation');
        return generateFallbackAnalysis(anomaly);
    }

    try {
        // Dynamic import to avoid issues if package is not installed
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = buildPrompt(anomaly);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse structured response
        const parsed = parseAIResponse(text, anomaly);
        console.log('✅ LLM analysis completed successfully');
        return parsed;
    } catch (error) {
        console.error('❌ LLM Analysis failed:', error);
        // Fallback to basic explanation
        return generateFallbackAnalysis(anomaly);
    }
}

/**
 * Build the prompt for the LLM
 */
function buildPrompt(anomaly: DetectedAnomaly): string {
    return `You are a security analyst for a financial audit system. Analyze the following anomaly and provide:
1. A clear, professional explanation of why this is suspicious (2-3 sentences)
2. A risk score from 1-100
3. 2-3 recommended actions for administrators

Anomaly Type: ${anomaly.anomalyType}
Severity: ${anomaly.severity}
Context Data: ${JSON.stringify(anomaly.contextData, null, 2)}

Respond in this exact JSON format:
{
  "explanation": "Your explanation here",
  "riskScore": 75,
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}

Be concise and professional. Focus on the business impact and security implications.
Do not include any markdown formatting or code blocks, just the raw JSON.`;
}

/**
 * Parse the AI response into structured format
 */
function parseAIResponse(text: string, anomaly: DetectedAnomaly): LLMAnalysisResult {
    try {
        // Extract JSON from response (handle potential markdown code blocks)
        let jsonText = text;

        // Remove markdown code blocks if present
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            jsonText = codeBlockMatch[1];
        }

        // Find JSON object
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                explanation: parsed.explanation || generateFallbackExplanation(anomaly),
                riskScore: Math.min(100, Math.max(1, parseInt(parsed.riskScore) || 50)),
                suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : getDefaultSuggestions()
            };
        }
    } catch (e) {
        console.error('Failed to parse AI response:', e);
    }

    return generateFallbackAnalysis(anomaly);
}

/**
 * Generate fallback analysis when LLM is unavailable
 */
function generateFallbackAnalysis(anomaly: DetectedAnomaly): LLMAnalysisResult {
    return {
        explanation: generateFallbackExplanation(anomaly),
        riskScore: getSeverityScore(anomaly.severity),
        suggestions: getSuggestionsForType(anomaly.anomalyType)
    };
}

/**
 * Generate a fallback explanation based on anomaly type
 */
function generateFallbackExplanation(anomaly: DetectedAnomaly): string {
    const ctx = anomaly.contextData;

    const explanations: Record<string, string> = {
        VOLUME_SPIKE: `User "${ctx.user || 'Unknown'}" performed ${ctx.actionCount || 'multiple'} actions within ${ctx.timeWindowMinutes || 'a short'} minutes, which significantly exceeds normal activity levels. This pattern may indicate automated scripts, credential compromise, or intentional data manipulation.`,

        OFF_HOURS: `Activity was detected at ${ctx.hour !== undefined ? `${ctx.hour}:00` : 'an unusual time'} on ${getDayName(ctx.dayOfWeek)}, which is outside of configured business hours. This could indicate unauthorized access, after-hours work that should be verified, or potential security incident.`,

        MASS_DELETE: `${ctx.deleteCount || 'Multiple'} delete operations were detected within ${ctx.timeWindowMinutes || 'a short'} minutes by user "${ctx.user || 'Unknown'}". This unusual pattern could indicate data cleanup, but may also suggest unauthorized data removal or potential insider threat.`,

        RAPID_UPDATES: `Entity ${ctx.entityType || 'record'}:${ctx.entityId || 'unknown'} was modified ${ctx.updateCount || 'multiple'} times within ${ctx.timeWindowMinutes || 'a short'} minutes. This rapid modification pattern may indicate testing, application errors, or suspicious tampering attempts.`,

        FIRST_TIME_SPIKE: `A new user "${ctx.user || 'Unknown'}" exhibited unusually high activity immediately after their first action. This could be a legitimate power user, but may also indicate compromised credentials or unauthorized account usage.`,

        SUSPICIOUS_PATTERN: `An unusual activity pattern was detected that doesn't match typical user behavior. Further investigation is recommended to determine if this represents a security concern.`
    };

    return explanations[anomaly.anomalyType] || 'Unusual activity pattern detected that warrants investigation.';
}

/**
 * Get day name from day number
 */
function getDayName(day: number | undefined): string {
    if (day === undefined) return 'an unusual day';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || 'an unusual day';
}

/**
 * Get risk score based on severity
 */
function getSeverityScore(severity: AnomalySeverity): number {
    const scores: Record<AnomalySeverity, number> = {
        LOW: 25,
        MEDIUM: 50,
        HIGH: 75,
        CRITICAL: 95
    };
    return scores[severity] || 50;
}

/**
 * Get default suggestions
 */
function getDefaultSuggestions(): string[] {
    return [
        'Review the audit log details for more context',
        'Contact the user to verify the activity was intentional',
        'Check for any related suspicious activities'
    ];
}

/**
 * Get suggestions specific to anomaly type
 */
function getSuggestionsForType(type: string): string[] {
    const suggestions: Record<string, string[]> = {
        VOLUME_SPIKE: [
            'Review the user\'s recent activity history for context',
            'Check if automated processes or scripts are running under this account',
            'Consider temporarily restricting the user\'s access pending investigation'
        ],
        OFF_HOURS: [
            'Verify with the user if they were performing authorized after-hours work',
            'Check login locations and IP addresses for anomalies',
            'Review what specific actions were performed during this time'
        ],
        MASS_DELETE: [
            'IMMEDIATELY review what data was deleted',
            'Check if backups are available for potential restoration',
            'Contact the user urgently to verify this was intentional',
            'Consider temporarily suspending the user\'s delete permissions'
        ],
        RAPID_UPDATES: [
            'Review the sequence of changes made to the entity',
            'Check if data integrity has been compromised',
            'Investigate if this pattern matches any known attack vectors'
        ],
        FIRST_TIME_SPIKE: [
            'Verify the user\'s identity and authorization level',
            'Review what resources were accessed',
            'Check if the account was recently created or modified'
        ],
        SUSPICIOUS_PATTERN: [
            'Conduct a thorough review of all recent activities by this user',
            'Cross-reference with other security logs and systems',
            'Consider engaging security team for deeper analysis'
        ]
    };

    return suggestions[type] || getDefaultSuggestions();
}
