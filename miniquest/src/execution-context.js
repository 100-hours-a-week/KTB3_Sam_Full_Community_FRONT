/*
const message = "Hello, JavaScript!";

const showMessage = () => {
  console.log(message);
  let message = "Hello, ES6!";
  console.log(message);
};

showMessage();
*/

const color = "blue";

const firstLevel = () => {
  let color = "red";

  const secondLevel = () => {
    let color = "green";
    console.log(color);
  };

  secondLevel();
  console.log(color);
};

firstLevel();
console.log(color);
