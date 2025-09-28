
// console.log = function () {};   // disable log
// console.debug = function () {}; // disable debug
// console.warn aur console.error chalne do agar zaroori hai


// now just for production
// utils/disableConsole.js

if (process.env.NODE_ENV === "production") {
  console.log = () => {};
}
