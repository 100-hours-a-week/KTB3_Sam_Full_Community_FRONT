const myFisrtPromise = new Promise((resolve, reject) => {
  try {
    resolve("Hello, Promise");
  } catch (e) {
    reject(e);
  }
});

myFisrtPromise.then((message) => {
  console.log(message);
});
