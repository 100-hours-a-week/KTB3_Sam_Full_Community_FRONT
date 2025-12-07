async function waitForMessage() {
  setTimeout(() => {
    console.log("Hello, Async/Await!");
  }, 1000);
}

await waitForMessage();
