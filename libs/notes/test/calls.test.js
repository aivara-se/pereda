import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";

import { openLog, saveDay, searchNotes } from "../src/calls.js";
import { addDays } from "../src/day.js";
import { openStore } from "../src/store.js";

// A fixed clock, so the page and the day the calls read are the same in every
// run. A call takes the day it is made on; the surfaces pass their own clock.
const NOW = "2026-11-02";

function memoryStore() {
  return openStore(":memory:", (path) => new Database(path));
}

// A day `offset` days before NOW.
function dayBefore(offset) {
  return addDays(NOW, -offset);
}

describe("the log", () => {
  test("starts with today, empty, when nothing was written", () => {
    const store = memoryStore();
    expect(openLog(store, {}, NOW)).toEqual({
      today: NOW,
      days: [{ day: NOW, body: "", seq: 0 }],
      more: false,
    });
    store.close();
  });

  test("reads the days before the oldest one loaded, newest first", () => {
    const store = memoryStore();
    store.save(dayBefore(1), "one", 1);
    store.save(dayBefore(2), "two", 1);
    store.save(dayBefore(3), "three", 1);

    expect(openLog(store, {}, NOW).days.map((entry) => entry.day)).toEqual([
      NOW,
      dayBefore(1),
      dayBefore(2),
      dayBefore(3),
    ]);
    expect(
      openLog(store, { before: dayBefore(2) }, NOW).days.map((e) => e.day),
    ).toEqual([dayBefore(3)]);
    store.close();
  });

  test("opens at a day instead of at today when it is given one", () => {
    const store = memoryStore();
    store.save(dayBefore(2), "two", 1);
    store.save(dayBefore(3), "three", 1);
    store.save(dayBefore(1), "one", 1);

    expect(
      openLog(store, { from: dayBefore(2) }, NOW).days.map((e) => e.day),
    ).toEqual([dayBefore(2), dayBefore(3)]);
    store.close();
  });

  test("reads thirty days a page and says there is more", () => {
    const store = memoryStore();
    for (let offset = 0; offset < 31; offset += 1) {
      store.save(dayBefore(offset), "a note", 1);
    }

    const log = openLog(store, {}, NOW);
    expect(log.more).toBe(true);
    expect(log.days).toHaveLength(30);
    expect(log.days[29].day).toBe(dayBefore(29));
    store.close();
  });

  test("refuses a bound that is not a date", () => {
    const store = memoryStore();
    expect(() => openLog(store, { before: "yesterday" }, NOW)).toThrow(
      "That is not a date.",
    );
    expect(() => openLog(store, { from: "2026-02-30" }, NOW)).toThrow(
      "That is not a date.",
    );
    store.close();
  });
});

describe("the save", () => {
  test("stores the whole body and answers with the stored counter", () => {
    const store = memoryStore();
    expect(saveDay(store, { day: NOW, body: "Hello.", seq: 1 }, NOW)).toEqual({
      day: NOW,
      seq: 1,
      today: NOW,
    });
    expect(store.day(NOW)).toEqual({ body: "Hello.", seq: 1 });
    store.close();
  });

  test("refuses a body that is not text, a counter, and a day after today", () => {
    const store = memoryStore();
    expect(() => saveDay(store, { day: NOW, body: 3, seq: 1 }, NOW)).toThrow(
      "A note is plain text.",
    );
    expect(() => saveDay(store, { day: NOW, body: "" }, NOW)).toThrow(
      "A save needs a counter.",
    );
    expect(() =>
      saveDay(store, { day: dayBefore(-1), body: "", seq: 1 }, NOW),
    ).toThrow("A day after today cannot be written.");
    expect(() =>
      saveDay(store, { day: "2026-02-30", body: "", seq: 1 }, NOW),
    ).toThrow("That is not a date.");
    store.close();
  });

  test("reports a counter that lost the comparison", () => {
    const store = memoryStore();
    saveDay(store, { day: NOW, body: "Second.", seq: 2 }, NOW);
    expect(() =>
      saveDay(store, { day: NOW, body: "Older.", seq: 2 }, NOW),
    ).toThrow("This note was written somewhere else.");
    expect(store.day(NOW)).toEqual({ body: "Second.", seq: 2 });
    store.close();
  });
});

describe("the search", () => {
  test("matches every word as a prefix, newest first, today left out", () => {
    const store = memoryStore();
    store.save(dayBefore(1), "apple tree", 1);
    store.save(dayBefore(2), "apple pie", 1);
    store.save(NOW, "apple today", 1);

    expect(
      searchNotes(store, { query: "appl" }, NOW).days.map((e) => e.day),
    ).toEqual([dayBefore(1), dayBefore(2)]);
    store.close();
  });

  test("answers an exact date with the log at that day", () => {
    const store = memoryStore();
    store.save(dayBefore(2), "two", 1);
    store.save(dayBefore(3), "three", 1);

    expect(searchNotes(store, { query: dayBefore(2) }, NOW)).toEqual({
      jump: {
        day: dayBefore(2),
        days: [
          { day: dayBefore(2), body: "two", seq: 1 },
          { day: dayBefore(3), body: "three", seq: 1 },
        ],
        more: false,
      },
    });
    store.close();
  });

  test("lands on today even when nothing is written there", () => {
    const store = memoryStore();
    store.save(dayBefore(1), "one", 1);

    expect(searchNotes(store, { query: NOW }, NOW).jump).toEqual({
      day: NOW,
      days: [
        { day: NOW, body: "", seq: 0 },
        { day: dayBefore(1), body: "one", seq: 1 },
      ],
      more: false,
    });
    store.close();
  });

  test("refuses a date after today and a search with no words", () => {
    const store = memoryStore();
    expect(searchNotes(store, { query: dayBefore(-1) }, NOW)).toEqual({
      refused: "A day after today cannot be opened.",
    });
    expect(() => searchNotes(store, { query: 7 }, NOW)).toThrow(
      "A search needs words.",
    );
    store.close();
  });
});
