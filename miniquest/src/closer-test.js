function createCounter() {
  let count = 0;
  function increment() {
    return count++;
  }

  function decreament() {
    return count--;
  }

  function getCount() {
    return count;
  }

  return { increment, decreament, getCount };
}

function messageMaker(message) {
  function makeMessage(additionalMessage) {
    return message + additionalMessage;
  }

  return makeMessage;
}
