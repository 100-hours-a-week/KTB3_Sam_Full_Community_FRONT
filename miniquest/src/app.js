import { add, subtract } from "./operation.js";
import User from "./user-profile.js";

console.log(add(2, 3));

const user = new User("test", 30);
console.log(user.name);
