let array = [1, 2, 3, 4, 5];

array.reduce((arr, cur) => {
  return arr + cur;
}, 0);
console.log(array);

array.map((ele) => ele * 10);
console.log(array);
