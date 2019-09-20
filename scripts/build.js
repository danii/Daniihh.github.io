let {performance} = require("perf_hooks");
let fs = require("fs");
let babel = require("@babel/core");

//Timer Obj
let timer = {
  time(item) {
    item = item || "Total Time";
    if (!this[item]) this[item] = performance.now();
    else this[item] = (performance.now() - this[item]) / 1000;
  },

  toString() {
    let {toString, time, ...me} = this;
    return JSON.stringify(me, null, 2);
  }
}
timer.time();
timer.time("Initialize");

let args = process.argv.splice(3);
let projectLocation = __dirname + process.argv[2];
let config = JSON.parse(fs.readFileSync(projectLocation + "config.json"));

if (["--watch", "-w"].some((i) => args[0] == i)) {
  //Not yet supported.
  console.error("Unsupported feature.");
} else {
  //TODO: Make subroutine.
  let taskName = args[0] || "build";
  let task = config.tasks.find((i) => i.name == taskName);
  let files = [];

  let findMatching = (name) => {
    let path = name.split(/\/|\\/g);
    let splitName = path.pop().split(/\*/g);
    splitName = splitName.map((piece) => piece.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    let nameMatcher = new RegExp(splitName.join("((?:\\s|\\S)+)"));
    let dir = path.join("/") + "/";

    let names = fs.readdirSync(dir).map((file) => dir + file);
    return names.filter((name) => nameMatcher.test(name));
  };

  if (typeof task.includes == "string") files = findMatching(task.includes);
  else task.includes.forEach((matcher) => files.push(findMatching(matcher)));
  files = Object.fromEntries(files.map((file) => [file, undefined]));
  
  for (let file of Object.keys(files))
    files[file] = fs.readFileSync(projectLocation + file).toString();
  timer.time("Initialize");
  console.log(`Initialization completed in ${timer.Initialize}s.`)
  
  task.chain.forEach((chainItem, ind) => {
    timer.time(`Chain ${ind}`);
    for (let file of Object.keys(files)) {
      let {destination, ...data} = chainItem;
      data.filename = file;
      files[file] = babel.transformSync(files[file], data).code;

      let n = file.split(/\/|\\/g).pop();
      let o = n.split(".")[0];

      if (!files[file].match(/\s/g)) {
        delete files[file];
        continue;
      }

      destination = destination.replace(/%n/g, n).replace(/%o/g, o);
      fs.writeFileSync(projectLocation + destination, files[file]);
    }
    timer.time(`Chain ${ind}`);
    console.log(`Chain ${ind} completed in ${timer[`Chain ${ind}`]}s.`);
  });
}

timer.time();
console.log(timer.toString());
