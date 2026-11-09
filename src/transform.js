
// PERSONAL QUOTE COLLECTION & QUOTE SELECTOR

// SETTINGS


// Available modes:
// "custom" = Use only custom quotes
// "zen"    = Use only ZenQuotes
// "mixed"  = Use both sources

const QUOTE_MODE = "zen";

// In mixed mode, this controls how often custom
// quotes are selected instead of ZenQuotes.
//
// Example: 70 means custom quotes are picked
// roughly 70% of the time.

const CUSTOM_QUOTE_PERCENT = 70;

// Used when a custom quote doesn't have an author.

const DEFAULT_AUTHOR = "itscryptune";


// CUSTOM QUOTES

// Add your quotes here.
//
// Each entry needs a text and an author.
// Separate entries with a comma.
//
// Leave the author empty ("") to use
// the default author defined above.


const CUSTOM_QUOTES = [

  {
    text: "If the code works, do not touch it. If it breaks, pretend it is a feature.",
    author: "itscryptune"
  },

  {
    text: "Being confused is just the first step toward understanding something interesting.",
    author: "itscryptune"
  },

  {
    text: "You cannot become good at something without being bad at it first.",
    author: "itscryptune"
  },

  {
    text: "If life gives you bugs, open the debugger.",
    author: "itscryptune"
  },

  {
    text: "Finish your homework before your homework finishes your free time.",
    author: "itscryptune"
  },

  {
    text: "Big projects start with small experiments.",
    author: "itscryptune"
  },

  {
    text: "Your future self is going to appreciate the work you do today.",
    author: "itscryptune"
  },

  {
    text: "Even the smartest developer searches for solutions.",
    author: "itscryptune"
  }

];


// VALIDATE CUSTOM QUOTES

function getValidCustomQuotes() {

  return CUSTOM_QUOTES.filter((quote) => {

    if (!quote || typeof quote.text !== "string") {
      return false;
    }

    return quote.text.trim().length > 0;

  });

}


//  LOCAL DATE

function getLocalDateParts(input) {

  const timeZone =
    input?.trmnl?.user?.time_zone_iana ||
    "Asia/Kolkata";

  let formatter;

  try {

    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });

  } catch (error) {

    // Fall back to IST if the timezone is invalid.

    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });

  }

  const parts = formatter.formatToParts(new Date());

  const values = {};

  for (const part of parts) {
    values[part.type] = part.value;
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day)
  };

}



// DAILY RANDOM SEED


// Generate a seed from the current date.
// Keeps the selected quote consistent throughout
// the day instead of changing on every refresh.

function getDailySeed(input) {

  const date = getLocalDateParts(input);

  const dateNumber =
    date.year * 10000 +
    date.month * 100 +
    date.day;

  let seed = dateNumber >>> 0;

  seed ^= seed >>> 16;
  seed = Math.imul(seed, 0x7feb352d);

  seed ^= seed >>> 15;
  seed = Math.imul(seed, 0x846ca68b);

  seed ^= seed >>> 16;

  return seed >>> 0;

}


// PICK CUSTOM QUOTE

function chooseCustomQuote(quotes, seed) {

  if (quotes.length === 0) {
    return null;
  }

  const index = seed % quotes.length;

  const selectedQuote = quotes[index];

  return {
    quote_text: selectedQuote.text.trim(),

    quote_author:
      selectedQuote.author?.trim() ||
      DEFAULT_AUTHOR,

    quote_source: "custom",

    source_label: "PERSONAL COLLECTION",

    quote_category: "MY QUOTES",

    quote_number: index + 1
  };

}


// READ ZENQUOTES

function chooseZenQuote(input) {

  let results = input?.data;

  // Handle both direct API responses and responses
  // where the actual results are inside a data field.

  if (results && !Array.isArray(results)) {
    results = results.data || results;
  }

  if (!Array.isArray(results)) {
    return null;
  }

  if (results.length === 0) {
    return null;
  }

  const item = results[0];

  if (!item || typeof item.q !== "string") {
    return null;
  }

  if (!item.q.trim()) {
    return null;
  }

  return {
    quote_text: item.q.trim(),

    quote_author:
      typeof item.a === "string" && item.a.trim()
        ? item.a.trim()
        : "Unknown Author",

    quote_source: "zenquotes",

    source_label: "ZENQUOTES.IO",

    quote_category: "DAILY INSPIRATION",

    quote_number: 0
  };

}



// MAIN SELECTOR


function run(input) {

  const seed = getDailySeed(input);

  const customQuotes = getValidCustomQuotes();

  const custom = chooseCustomQuote(
    customQuotes,
    seed
  );

  const zen = chooseZenQuote(input);

  let selected = null;

  if (QUOTE_MODE === "custom") {

    selected = custom || zen;

  } else if (QUOTE_MODE === "zen") {

    selected = zen || custom;

  } else {

    // Pick the quote source separately from the
    // seed used to select an individual custom quote.

    const sourceSeed =
      (Math.imul(seed, 1664525) + 1013904223) >>> 0;

    const useCustom =
      sourceSeed % 100 < CUSTOM_QUOTE_PERCENT;

    if (useCustom) {
      selected = custom || zen;
    } else {
      selected = zen || custom;
    }

  }

  // Use a default quote if neither source returned
  // anything usable.

  if (!selected) {

    selected = {
      quote_text:
        "A small step forward is still progress.",

      quote_author: "Daily Spark",

      quote_source: "fallback",

      source_label: "DAILY SPARK",

      quote_category: "DAILY INSPIRATION",

      quote_number: 0
    };

  }

  return {
    ...selected,

    custom_quote_count: customQuotes.length
  };

}