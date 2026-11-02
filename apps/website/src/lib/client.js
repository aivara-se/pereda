// The page's side of the worker: one request at a time, each answered by its
// own id, so a slow call never answers for a later one.

let worker = null;
let sent = 0;
const waiting = new Map();

function start() {
  worker = new Worker(new URL("./worker.js", import.meta.url), {
    type: "module",
  });
  worker.onmessage = (event) => {
    const { id, value, error } = event.data;
    const answer = waiting.get(id);
    if (answer === undefined) return;
    waiting.delete(id);
    if (error === undefined) answer.resolve(value);
    else answer.reject(new Error(error));
  };
  return worker;
}

export function call(name, ...args) {
  const id = ++sent;
  const target = worker ?? start();
  return new Promise((resolve, reject) => {
    waiting.set(id, { resolve, reject });
    target.postMessage({ id, name, args });
  });
}
