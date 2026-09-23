# AI Reading Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a provider-neutral, mock-driven AI reading pipeline to the existing upright-only One Oracle flow, with deterministic local fallback and backward-compatible journal storage.

**Architecture:** Keep `OracleCore` authoritative for the already-selected card and pass its immutable result through a pure reading request builder. A local mock provider and a deterministic fallback both return the same `readingResult`; the UI receives only that result and never knows a provider type. Phase 1 performs no network AI call and deploys no Worker.

**Tech Stack:** Browser JavaScript using the repository's UMD/CommonJS pattern, JSON data files, Node.js built-in `node:test`, existing GitHub Pages HTML/CSS.

**Spec:** `docs/superpowers/specs/2026-09-23-ai-reading-architecture-design.md`

## Global Constraints

- Keep the current One Oracle upright-only; `orientationMode` is `upright_only` and `reversedProbability` is ignored in Phase 1.
- AI never draws, replaces, reverses, or retries a card selection.
- `general` and `action` meanings are always used; zero or more supplemental categories may be used.
- The public result exposes only `mode: "ai" | "fallback"`; fallback reason remains an internal diagnostic.
- Normal readings allow `cautions: []`; cautions appear only for materially sensitive questions.
- No Gemini, OpenAI, Cloudflare AI, Worker deployment, API key, billing, Turnstile, or public `/api/reading` is included.
- Existing CSS/SVG animation timings and visual assets remain unchanged.
- Existing browser-local journal records remain readable.
- New production behavior follows red-green-refactor TDD.

## Review Focus

- A result event fired twice must not create two different card selections or duplicate the saved journal record.
- Missing or malformed local JSON must produce a usable fallback result rather than leave the result panel loading forever.
- A question matching both love and work must retain both supplemental categories while always retaining `general` and `action`.
- HTML-like text in the question or mock result must render as text and never execute.
- Legacy journal records containing `{title,message,action}` must still render after new structured readings are introduced.

---

### Task 1: Canonical card and spread data

**Files:**
- Create: `data/cards-major.json`
- Create: `data/spreads.json`
- Create: `reading/reading-data.js`
- Create: `reading-data.test.cjs`

**Interfaces:**
- Consumes: no production module.
- Produces: `ReadingData.validateCardCatalog(value)`, `ReadingData.validateSpreadCatalog(value)`, `ReadingData.cardKeyFromLegacyId(id)`, and `ReadingData.indexCatalogs(cards, spreads)`.

- [ ] **Step 1: Write the failing catalog tests**

Add literal assertions which fail because `reading/reading-data.js` and the JSON catalogs do not exist:

```js
test('major catalog has 22 stable ids and every required upright/reversed field', () => {
  const catalog=JSON.parse(fs.readFileSync('data/cards-major.json','utf8'));
  assert.equal(catalog.cards.length,22);
  assert.equal(new Set(catalog.cards.map(c=>c.id)).size,22);
  assert.equal(catalog.cards[0].id,'major-00');
  assert.equal(catalog.cards[21].id,'major-21');
  for(const card of catalog.cards) for(const orientation of ['upright','reversed'])
    for(const field of ['general','love','work','finance','relationships','action'])
      assert.ok(card.meanings[orientation][field].trim());
});

test('one oracle declares one message position and upright-only defaults', () => {
  const spread=spreads.spreads.find(s=>s.id==='one-oracle');
  assert.equal(spread.cardCount,1);
  assert.deepEqual(spread.orientation,{orientationMode:'upright_only',reversedProbability:0});
  assert.deepEqual(spread.positions.map(p=>p.id),['message']);
});
```

- [ ] **Step 2: Run the new test and confirm RED**

Run: `node --test reading-data.test.cjs`

Expected: FAIL because the data files or `ReadingData` module are missing.

- [ ] **Step 3: Add the canonical catalogs and validation module**

Create all 22 Major Arcana entries with stable IDs and meaningful Japanese content for every required field. Preserve the current card order and names. Define `one-oracle` in `spreads.json` with `orientationMode: "upright_only"` and `reversedProbability: 0`.

Implement strict validation without external dependencies. Reject duplicate IDs, missing text fields, mismatched card counts, duplicate position IDs, unsupported orientation modes, and probabilities outside 0–1. Use the repository's existing UMD/CommonJS export shape.

- [ ] **Step 4: Run catalog tests and the existing suite**

Run: `node --test reading-data.test.cjs one-oracle-flow.test.cjs oracle-journal.test.cjs`

Expected: all tests PASS.

- [ ] **Step 5: Commit the data boundary**

Commit message: `Add extensible tarot card and spread catalogs`

### Task 2: Reading request and result contracts

**Files:**
- Create: `schemas/reading-request.schema.json`
- Create: `schemas/reading-result.schema.json`
- Create: `reading/reading-contract.js`
- Create: `reading-contract.test.cjs`

**Interfaces:**
- Consumes: indexed catalogs from `ReadingData.indexCatalogs(cards, spreads)`.
- Produces: `ReadingContract.buildRequest({question,spreadId,selections,output}, catalogs)` and `ReadingContract.validateResult(result, request)`.

- [ ] **Step 1: Write failing behavior tests for request construction**

```js
test('buildRequest preserves the confirmed upright card and trims the question', () => {
  const request=buildRequest({question:'  転職を迷っています  ',spreadId:'one-oracle',
    selections:[{positionId:'message',cardId:'major-21',orientation:'upright'}]},catalogs);
  assert.equal(request.question,'転職を迷っています');
  assert.deepEqual(request.cards,[{positionId:'message',cardId:'major-21',orientation:'upright'}]);
  assert.equal(request.readingTier,'brief');
  assert.equal(request.output.maxCharacters,500);
});

test('buildRequest rejects changed cards, reversed phase-one cards, and oversized questions', () => {
  assert.throws(()=>make({cardId:'major-99'}),/カード/);
  assert.throws(()=>make({orientation:'reversed'}),/正位置/);
  assert.throws(()=>make({question:'あ'.repeat(501)}),/500/);
});
```

Add output validation cases for missing fields, mismatched card/position IDs, unsupported `mode`, non-array cautions, and `cautions: []` acceptance.

- [ ] **Step 2: Run and confirm RED**

Run: `node --test reading-contract.test.cjs`

Expected: FAIL because `ReadingContract` is missing.

- [ ] **Step 3: Add JSON schemas and minimal runtime validation**

The JSON schemas document the wire contract. Runtime validation stays in `reading-contract.js` to avoid adding a schema-library dependency. `buildRequest` must copy the confirmed selection and never call a random function. `validateResult` must return a cleaned result containing only public fields.

- [ ] **Step 4: Run contract and full tests**

Run: `node --test reading-contract.test.cjs reading-data.test.cjs one-oracle-flow.test.cjs oracle-journal.test.cjs`

Expected: all tests PASS.

- [ ] **Step 5: Commit the public contract**

Commit message: `Define AI reading request and result contracts`

### Task 3: Prompt preparation, mock provider, and deterministic fallback

**Files:**
- Create: `reading/prompt-builder.js`
- Create: `reading/mock-provider.js`
- Create: `reading/fallback-reading.js`
- Create: `reading/reading-service.js`
- Create: `reading-service.test.cjs`

**Interfaces:**
- Consumes: validated request and indexed catalogs.
- Produces: `PromptBuilder.prepare(request,catalogs)`, `MockProvider.generateReading(prepared)`, `FallbackReading.create(request,catalogs)`, and `ReadingService.create({provider,fallback,onDiagnostic,idFactory}).read(request,catalogs)`.

- [ ] **Step 1: Write failing tests for category selection and interpretive value**

```js
test('prepare always includes general/action and permits multiple supplemental categories', () => {
  const prepared=prepare(makeRequest('恋人との関係と職場での距離感を考えたい'),catalogs);
  assert.deepEqual(prepared.cards[0].meaningKeys,
    ['general','action','love','work','relationships']);
});

test('mock result connects the question to the card instead of copying one dictionary field', async () => {
  const result=await service.read(makeRequest('転職を迷っています'),catalogs);
  assert.equal(result.mode,'ai');
  assert.match(result.interpretation,/転職/);
  assert.notEqual(result.interpretation,catalogs.cardsById.get('major-21').meanings.upright.general);
  assert.deepEqual(result.cautions,[]);
});
```

The category selector uses explicit Japanese keyword groups only as a Phase 1 cost-control heuristic. It may return zero or multiple supplemental categories and must keep `general` and `action` first.

- [ ] **Step 2: Write failing fallback and diagnostic tests**

Cover provider errors `timeout`, `rate_limit`, `quota`, malformed output, disabled provider, and offline transport. Assert that the public result contains only `mode: "fallback"`, while `onDiagnostic` receives one of `disabled | quota | timeout | rate_limit | provider_error | invalid_output | offline`.

- [ ] **Step 3: Run and confirm RED**

Run: `node --test reading-service.test.cjs`

Expected: FAIL because the service modules are missing.

- [ ] **Step 4: Implement the minimal pure reading pipeline**

`PromptBuilder.prepare` supplies the question, spread/position meaning, selected card, orientation, always-present general/action fields, supplemental fields, and explicit instructions to explain concrete connections. Its multi-card-ready shape includes `relationshipAnalysis` instructions for reinforcement, contradiction, causality, time flow, and outcome conditions, even though One Oracle has one card.

`MockProvider` returns a deterministic `mode: "ai"` result of roughly 300–500 Japanese characters and uses the question text in the interpretation. It performs no network call. `FallbackReading` creates a shorter deterministic result from position, general meaning, and action. `ReadingService` validates provider output and falls back on every supported failure without exposing the reason publicly.

- [ ] **Step 5: Add sensitive-topic caution behavior**

Add tests demonstrating that an ordinary career question yields `cautions: []`, while a question explicitly asking for medical, legal, investment, or immediate life-safety decisions yields the applicable caution. Implement this as a small pure classifier shared by mock and fallback output.

- [ ] **Step 6: Run service and full tests**

Run: `node --test reading-service.test.cjs reading-contract.test.cjs reading-data.test.cjs one-oracle-flow.test.cjs oracle-journal.test.cjs`

Expected: all tests PASS with no network requests.

- [ ] **Step 7: Commit the provider-neutral service**

Commit message: `Add mock AI reading service and local fallback`

### Task 4: Preserve upright-only OracleCore and enrich the result event

**Files:**
- Modify: `one-oracle-flow-core.js:4-37`
- Modify: `one-oracle-flow.test.cjs`
- Modify: `one-oracle-art-ui.js:101-120`

**Interfaces:**
- Consumes: current shuffle/cut/selection behavior.
- Produces: confirmed `{id,key,name,orientation:'upright'}` and `oracle:result` detail `{legacyCardId,cardId,orientation,spreadId,positionId}`.

- [ ] **Step 1: Add failing core tests**

```js
test('phase one keeps every confirmed card upright without consuming another random value', () => {
  let calls=0;
  const game=new OracleCore.Oracle(()=>{calls++;return .25});
  game.start(); game.cut(11); game.select(0);
  const before=calls, card=game.confirm();
  assert.equal(card.orientation,'upright');
  assert.equal(card.key,'major-'+String(card.id).padStart(2,'0'));
  assert.equal(calls,before);
});
```

Also assert that existing Fisher–Yates, cut, and selection tests remain unchanged.

- [ ] **Step 2: Run and confirm RED**

Run: `node --test one-oracle-flow.test.cjs`

Expected: FAIL because `key` and `orientation` are absent.

- [ ] **Step 3: Add stable key and upright result metadata**

Do not add reversed randomization. Keep deck entries and all animation timing intact. Update only the result event payload after confirmation.

- [ ] **Step 4: Run the core and full tests**

Run: `node --test one-oracle-flow.test.cjs reading-service.test.cjs reading-contract.test.cjs reading-data.test.cjs oracle-journal.test.cjs`

Expected: all tests PASS.

- [ ] **Step 5: Commit the result boundary**

Commit message: `Expose stable upright One Oracle result metadata`

### Task 5: Connect the mock reading pipeline to the existing result UI

**Files:**
- Create: `reading/reading-client.js`
- Create: `reading/reading-controller.js`
- Create: `reading-controller.test.cjs`
- Modify: `one-oracle-art-demo.html` (result controls and script-loading block)
- Modify: `oracle-journal-ui.js:8-25`
- Modify: `oracle-journal.css`

**Interfaces:**
- Consumes: `oracle:result` event and Phase 1 local catalogs/service.
- Produces: `reading:loading` and `reading:ready` events; `reading:ready.detail` is the validated public `readingResult` plus immutable request context used by journal storage.

- [ ] **Step 1: Write a failing controller test with a real service**

Use a small event target and the real MockProvider. Dispatch one `oracle:result`, then assert one `reading:ready` with the same card ID, `orientation: "upright"`, and `mode: "ai"`. Dispatch the same event twice while the first promise is pending and assert that only one reading is produced for that result token.

- [ ] **Step 2: Run and confirm RED**

Run: `node --test reading-controller.test.cjs`

Expected: FAIL because the client/controller modules are missing.

- [ ] **Step 3: Implement local mock client and controller**

Phase 1 `ReadingClient` loads `data/cards-major.json` and `data/spreads.json`, builds the validated request, and invokes the local ReadingService with MockProvider. If catalog loading or service execution fails, it uses the shared local fallback. It never calls a remote URL.

The controller captures the question once when the card is confirmed, assigns a result token, dispatches loading, and then dispatches ready. It must not modify or re-run `OracleCore`.

- [ ] **Step 4: Add the optional question control and structured renderer**

Add a textarea before the ritual starts, limited to 500 characters, with clear copy that Phase 1 uses a local mock and does not send the question externally. Hide or lock editing once card confirmation begins. Add script tags in dependency order without changing the existing art layers.

Replace the direct fixed-message listener in `oracle-journal-ui.js` with a `reading:ready` renderer for summary, interpretation, per-card reading, advice, and conditional cautions. Use `textContent`-based helpers only. During `reading:loading`, show a polite waiting state; on fallback, show only the generic simple-reading notice.

- [ ] **Step 5: Add HTML-like input safety test**

Feed `<img src=x onerror=alert(1)>` through the controller and renderer-facing result fixture. Assert the stored/rendered value remains text and no element is created from it. Keep DOM mutation verification in the browser smoke test; the unit assertion covers sanitization at the result boundary.

- [ ] **Step 6: Run tests and syntax checks**

Run: `node --test reading-controller.test.cjs reading-service.test.cjs reading-contract.test.cjs reading-data.test.cjs one-oracle-flow.test.cjs oracle-journal.test.cjs`

Run separately:

```text
node --check reading/reading-client.js
node --check reading/reading-controller.js
node --check oracle-journal-ui.js
node --check one-oracle-art-ui.js
```

Expected: all tests and syntax checks PASS.

- [ ] **Step 7: Commit the One Oracle UI connection**

Commit message: `Connect One Oracle to mock AI readings`

### Task 6: Store structured readings without breaking existing records

**Files:**
- Modify: `oracle-journal-store.js:4-12`
- Modify: `oracle-journal-ui.js:7-47`
- Modify: `oracle-journal.test.cjs`

**Interfaces:**
- Consumes: legacy reading `{title,message,action}` or new validated `readingResult` plus `{question,spreadId,cards}` context.
- Produces: journal records readable after reload, with legacy and structured reading render paths.

- [ ] **Step 1: Add failing migration and persistence tests**

Create a version-1 legacy fixture and assert it still loads unchanged. Save a structured reading with stable card ID, upright orientation, question, `mode`, empty cautions, and card readings; reload a new store instance and assert the complete snapshot survives. Assert duplicate saves remain idempotent.

- [ ] **Step 2: Run and confirm RED**

Run: `node --test oracle-journal.test.cjs`

Expected: FAIL because structured readings are rejected or stripped.

- [ ] **Step 3: Implement backward-compatible structured storage**

Keep the current storage key and accept legacy entries. Add strict cleaning for the new public result and request context, preserving only known string/array fields and existing memo/theme limits. Do not rewrite all legacy entries merely by reading them.

- [ ] **Step 4: Update journal detail rendering**

Render legacy entries with the current title/message/action view. Render structured entries with summary, interpretation, card readings, advice, and only non-empty cautions. Continue to render every value as text.

- [ ] **Step 5: Run the full automated suite**

Run: `node --test *.test.cjs`

Expected: all tests PASS, including pre-existing flow and journal tests.

- [ ] **Step 6: Commit storage compatibility**

Commit message: `Persist structured readings with legacy compatibility`

### Task 7: Browser verification and deliverable examples

**Files:**
- Modify only if a failing browser check reveals a defect, and add a failing regression test before each code fix.

**Interfaces:**
- Consumes: complete Phase 1 application.
- Produces: verified public mock/fallback flows and reportable example JSON.

- [ ] **Step 1: Start the static app locally and verify the mock path**

At 390×844 and 320×640, enter a normal question, complete shuffle/cut/select/confirm, and verify:

- the selected card remains upright;
- the result uses `mode: "ai"` internally and displays a question-specific mock reading;
- `cautions` is not shown when empty;
- saving creates exactly one record;
- reload preserves the structured result and memo editing.

- [ ] **Step 2: Verify fallback without changing the card**

Use the supported Phase 1 diagnostic switch or injected failing provider in a local test page to produce a timeout/provider failure. Verify the same selected card is shown, a generic simple-reading notice appears, detailed reason is absent from UI, and the result can be saved.

- [ ] **Step 3: Verify sensitive caution and text safety**

Use a medically or legally consequential question and verify a contextual caution appears. Enter HTML-like text and verify it displays literally with no new executable element and no console error.

- [ ] **Step 4: Run final checks**

Run: `node --test *.test.cjs`

Run syntax checks for every new and modified JavaScript file. Inspect browser console errors and confirm no horizontal overflow at 320px.

- [ ] **Step 5: Publish Phase 1 to `prototype/one-oracle-stage1` and verify GitHub Pages**

Publish only after all local checks pass. Confirm the public page loads the data files, runs the mock result flow, saves a record, and falls back if the diagnostic failure path is selected.

- [ ] **Step 6: Report the deliverables**

Report the exact changed file list, automated test count and result, browser widths tested, one captured mock `readingResult` example, one fallback `readingResult` example, and confirmation that no real provider/API key/Worker deployment was added.

