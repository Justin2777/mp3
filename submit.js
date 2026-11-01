// Self-check your MP3 against the course autograder.
//
// 1. Deploy your API (e.g. on Render) and set API_URL below to its base URL.
// 2. Run:  npm run submit    (or: node submit.js)
//
// The autograder cannot reach localhost, so API_URL must be your deployed URL.
// Requires Node 24 (LTS).

const API_URL = "https://YOUR-APP-NAME.onrender.com"; // <-- change this to your deployed API's URL

// Grader URL; DO NOT CHANGE.
const AUTOGRADER_URL = "https://cs409-mp3-grader.onrender.com";

const TIMEOUT_MS = 6 * 60 * 1000; // a free-tier Render app may need a minute to wake up

function fail(message) {
    console.error(`\n${message}\n`);
    process.exit(1);
}

async function main() {
    if (API_URL.includes("YOUR-APP-NAME")) {
        fail("Please edit API_URL at the top of submit.js to your deployed API URL.");
    }
    if (AUTOGRADER_URL.includes("REPLACE-WITH")) {
        fail("AUTOGRADER_URL has not been configured. Please contact the course staff.");
    }

    console.log(`Submitting ${API_URL} to the autograder...`);
    console.log("This can take a few minutes (the autograder runs many requests against your API).\n");

    let res;
    try {
        res = await fetch(`${AUTOGRADER_URL.replace(/\/+$/, "")}/grade`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: API_URL }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
    } catch (e) {
        fail(`Could not reach the autograder (${e.name === "TimeoutError" ? "timed out" : e.message}). Try again in a minute.`);
    }

    let result;
    try {
        result = await res.json();
    } catch {
        fail(`The autograder returned an unexpected response (HTTP ${res.status}).`);
    }
    if (!res.ok) {
        fail(`Autograder error (HTTP ${res.status}): ${result.error || JSON.stringify(result)}`);
    }

    const label = { passed: "PASS   ", partial: "PARTIAL", failed: "FAIL   " };
    for (const t of result.tests) {
        console.log(`[${label[t.status] || t.status}] ${t.test}  (${t.awardedScore}/${t.possibleScore})`);
        for (const m of t.messages) console.log(`           - ${m}`);
    }
    console.log(`\nScore: ${result.score}/100  (${result.awardedPoints}/${result.totalPoints} points)\n`);
}

main();
