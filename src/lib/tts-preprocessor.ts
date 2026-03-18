// src/lib/tts-preprocessor.ts
// Text preprocessor for natural TTS pronunciation

// ─── SCHEME NAME PRONUNCIATION MAP ────────────────────────────────────────────
const SCHEME_PRONUNCIATIONS: Record<string, string> = {
    'PM-JAY': 'P M Jay',
    'PMJAY': 'P M Jay',
    'PM KUSUM': 'P M Kusum',
    'KUSUM': 'Kusum',
    'MUDRA': 'Mudra',
    'PM Kisan': 'P M Kisan',
    'KCC': 'K C C',
    'PM Awas': 'P M Awaas',
    'PMAY': 'P M A Y',
    'PM Vishwakarma': 'P M Vishwakarma',
    'PM Fasal Bima': 'P M Fasal Beema',
    'PM Surya Ghar': 'P M Surya Ghar',
    'DISCOM': 'Dis-Com',
    'PM-SVANidhi': 'P M Swa Nidhi',
    'MGNREGA': 'M G N R E G A',
    'NHA': 'N H A',
    'APY': 'A P Y',
}

// ─── ABBREVIATION EXPANSIONS ──────────────────────────────────────────────────
const ABBREVIATIONS: Record<string, string> = {
    'kW': 'kilowatt',
    'kWh': 'kilowatt hour',
    'MW': 'megawatt',
    'sq ft': 'square feet',
    'sq.ft': 'square feet',
    'sq. ft': 'square feet',
    'govt': 'government',
    'govt.': 'government',
    'approx': 'approximately',
    'approx.': 'approximately',
    'etc': 'etcetera',
    'etc.': 'etcetera',
    'i.e.': 'that is',
    'e.g.': 'for example',
    'Rs': 'rupees',
    'Rs.': 'rupees',
    'no.': 'number',
    'No.': 'Number',
    'yr': 'year',
    'yrs': 'years',
    'mo': 'month',
    'mos': 'months',
    'lakh': 'lakh',
    'crore': 'crore',
    'cr': 'crore',
    'L': 'lakh',
}

// ─── NUMBER TO WORDS (ENGLISH) ────────────────────────────────────────────────
const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

function numberToWordsEn(num: number): string {
    if (num === 0) return 'zero'
    if (num < 0) return 'minus ' + numberToWordsEn(-num)

    let result = ''

    if (num >= 10000000) {
        result += numberToWordsEn(Math.floor(num / 10000000)) + ' crore '
        num %= 10000000
    }
    if (num >= 100000) {
        result += numberToWordsEn(Math.floor(num / 100000)) + ' lakh '
        num %= 100000
    }
    if (num >= 1000) {
        result += numberToWordsEn(Math.floor(num / 1000)) + ' thousand '
        num %= 1000
    }
    if (num >= 100) {
        result += ONES[Math.floor(num / 100)] + ' hundred '
        num %= 100
    }
    if (num >= 20) {
        result += TENS[Math.floor(num / 10)] + ' '
        num %= 10
    }
    if (num > 0) {
        result += ONES[num] + ' '
    }

    return result.trim()
}

// ─── NUMBER TO WORDS (HINDI) ──────────────────────────────────────────────────
const HINDI_ONES = ['', 'ek', 'do', 'teen', 'chaar', 'paanch', 'chhah', 'saat', 'aath', 'nau',
    'das', 'gyarah', 'baarah', 'terah', 'chaudah', 'pandrah', 'solah', 'satrah', 'atharah', 'unees']
const HINDI_TENS = ['', '', 'bees', 'tees', 'chaalees', 'pachaas', 'saath', 'sattar', 'assi', 'nabbe']

function numberToWordsHi(num: number): string {
    if (num === 0) return 'shunya'
    if (num < 0) return 'minus ' + numberToWordsHi(-num)

    let result = ''

    if (num >= 10000000) {
        result += numberToWordsHi(Math.floor(num / 10000000)) + ' crore '
        num %= 10000000
    }
    if (num >= 100000) {
        result += numberToWordsHi(Math.floor(num / 100000)) + ' lakh '
        num %= 100000
    }
    if (num >= 1000) {
        result += numberToWordsHi(Math.floor(num / 1000)) + ' hazaar '
        num %= 1000
    }
    if (num >= 100) {
        result += HINDI_ONES[Math.floor(num / 100)] + ' sau '
        num %= 100
    }
    if (num >= 20) {
        result += HINDI_TENS[Math.floor(num / 10)] + ' '
        num %= 10
    }
    if (num > 0) {
        result += HINDI_ONES[num] + ' '
    }

    return result.trim()
}

// ─── EXPAND CURRENCY + NUMBERS ────────────────────────────────────────────────
function expandNumbers(text: string, lang: string): string {
    const toWords = lang === 'hi' ? numberToWordsHi : numberToWordsEn
    const currencyWord = lang === 'hi' ? 'rupaye' : 'rupees'

    // ₹78,000 or ₹ 78,000 → "78000 rupees"
    text = text.replace(/₹\s?([\d,]+)/g, (_, numStr) => {
        const num = parseInt(numStr.replace(/,/g, ''), 10)
        if (isNaN(num)) return numStr
        return toWords(num) + ' ' + currencyWord
    })

    // Rs 5,000 or Rs. 5000
    text = text.replace(/Rs\.?\s?([\d,]+)/g, (_, numStr) => {
        const num = parseInt(numStr.replace(/,/g, ''), 10)
        if (isNaN(num)) return numStr
        return toWords(num) + ' ' + currencyWord
    })

    // Standalone large numbers with commas: 78,000 → words (only if > 999)
    text = text.replace(/\b([\d,]{5,})\b/g, (match) => {
        const num = parseInt(match.replace(/,/g, ''), 10)
        if (isNaN(num) || num < 1000) return match
        return toWords(num)
    })

    // Percentage: 90% → "ninety percent"
    text = text.replace(/(\d+(?:\.\d+)?)\s?%/g, (_, numStr) => {
        const num = parseFloat(numStr)
        if (isNaN(num)) return numStr
        const pctWord = lang === 'hi' ? 'pratishat' : 'percent'
        if (Number.isInteger(num)) return toWords(num) + ' ' + pctWord
        return numStr + ' ' + pctWord
    })

    return text
}

// ─── EXPAND ABBREVIATIONS ─────────────────────────────────────────────────────
function expandAbbreviations(text: string): string {
    for (const [abbr, expansion] of Object.entries(ABBREVIATIONS)) {
        // Word-boundary safe replacement
        const escaped = abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        text = text.replace(new RegExp(`\\b${escaped}\\b`, 'g'), expansion)
    }
    return text
}

// ─── FIX SCHEME NAMES ─────────────────────────────────────────────────────────
function fixSchemeNames(text: string): string {
    for (const [name, pronunciation] of Object.entries(SCHEME_PRONUNCIATIONS)) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        text = text.replace(new RegExp(escaped, 'gi'), pronunciation)
    }
    return text
}

// ─── HUMANIZE URLS ────────────────────────────────────────────────────────────
function humanizeURLs(text: string): string {
    // Match URLs like pmsuryaghar.gov.in, mudramitra.in, etc.
    text = text.replace(
        /(?:https?:\/\/)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/[^\s]*)?)/g,
        (match) => {
            // Split by dots and slashes, spell it out
            return match
                .replace(/https?:\/\//g, '')
                .replace(/\./g, ' dot ')
                .replace(/\//g, ' slash ')
                .replace(/-/g, ' dash ')
        }
    )
    return text
}

// ─── CLEAN MARKDOWN & NON-SPEAKABLE CONTENT ───────────────────────────────────
function cleanMarkdown(text: string): string {
    // Remove [LANG:xx] tags
    text = text.replace(/\[LANG:[a-z-]+\]/gi, '')

    // Remove markdown bold/italic
    text = text.replace(/\*\*(.+?)\*\*/g, '$1')
    text = text.replace(/\*(.+?)\*/g, '$1')
    text = text.replace(/__(.+?)__/g, '$1')
    text = text.replace(/_(.+?)_/g, '$1')

    // Remove markdown headers (keep the text)
    text = text.replace(/^#{1,6}\s+/gm, '')

    // Remove emojis (strip characters outside basic text and Indian script ranges)
    text = text.split('').filter(c => {
        const code = c.codePointAt(0) || 0
        // Keep ASCII, Latin, and all major Indian scripts (0x0900 to 0x0D7F), plus basic punctuation
        return (code >= 0x0020 && code <= 0x007E) ||
            (code >= 0x00A0 && code <= 0x024F) ||  // Latin extended
            (code >= 0x0900 && code <= 0x0D7F)     // Major Indian Scripts (Devanagari to Malayalam)
    }).join('')

    // Remove extra whitespace
    text = text.replace(/\s+/g, ' ')

    // Remove leading/trailing spaces per line
    text = text.split('\n').map(l => l.trim()).join('. ')

    return text.trim()
}

// ─── MAIN PREPROCESSOR ───────────────────────────────────────────────────────
export function preprocessForTTS(text: string, lang: string = 'en'): string {
    if (!text) return ''

    let processed = text

    // Step 1: Clean markdown and emojis
    processed = cleanMarkdown(processed)

    // Step 2: Fix scheme name pronunciations
    processed = fixSchemeNames(processed)

    // Step 3: Expand abbreviations
    processed = expandAbbreviations(processed)

    // Step 4: Humanize URLs
    processed = humanizeURLs(processed)

    // Step 5: Expand numbers and currency
    processed = expandNumbers(processed, lang)

    // Step 6: Add natural pauses for human-like speech rhythm
    // Add slight pause after sentences (period, question mark, exclamation)
    processed = processed.replace(/([.!?])\s+/g, '$1 ... ')
    // Add micro-pause after commas for breathing room
    processed = processed.replace(/,\s*/g, ', ')
    // Add pause between list items (after bullet point sentences)
    processed = processed.replace(/\.\s*\.\s+/g, '. ... ')

    // Step 7: Clean up any remaining artifacts
    processed = processed
        .replace(/\s+/g, ' ')
        .replace(/\.{4,}/g, '...')  // Max 3 dots for pauses
        .replace(/,\s*,/g, ',')
        .trim()

    return processed
}
