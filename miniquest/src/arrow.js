const array = [1, 2, 3, 4, 5];

const add = (a, b) => a + b;

function sumArray(arr) {
  let answer = 0;
  for (let i = 0; i < arr.length; i++) {
    answer += arr[i];
  }
  return answer;
}

console.log(sumArray(array));
