const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const POSTGRES_IMAGE = "postgres:15";
const CONTAINER_NAME = "e2e-test-postgres";
const POSTGRES_USER = "test";
const POSTGRES_PASSWORD = "test";
const POSTGRES_DB = "testdb";
const PORT = 5433; // avoid clashing with local postgres

function run(cmd) {
  return execSync(cmd, { encoding: "utf-8" }).trim();
}

function imageExists() {
  try {
    run(`docker image inspect ${POSTGRES_IMAGE}`);
    return true;
  } catch {
    return false;
  }
}

function pullImage() {
  console.log(`Pulling image ${POSTGRES_IMAGE}...`);
  run(`docker pull ${POSTGRES_IMAGE}`);
}

function containerExists() {
  try {
    run(`docker inspect ${CONTAINER_NAME}`);
    return true;
  } catch {
    return false;
  }
}

function containerIsRunning() {
  try {
    const out = run(`docker inspect -f '{{.State.Running}}' ${CONTAINER_NAME}`);
    return out === "true";
  } catch {
    return false;
  }
}

function startContainer() {
  console.log(`Starting existing container ${CONTAINER_NAME}...`);
  run(`docker start ${CONTAINER_NAME}`);
}

function createContainer() {
  console.log(`Creating and starting container ${CONTAINER_NAME}...`);
  run(
    `docker run -d --name ${CONTAINER_NAME} -e POSTGRES_USER=${POSTGRES_USER} -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} -e POSTGRES_DB=${POSTGRES_DB} -p ${PORT}:5432 ${POSTGRES_IMAGE}`
  );
}

function waitForPostgres() {
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      run(
        `docker exec ${CONTAINER_NAME} pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}`
      );
      ready = true;
      break;
    } catch {
      process.stdout.write(".");
      require("child_process").execSync("sleep 1");
    }
  }
  if (!ready) throw new Error("Postgres did not start in time");
}

function main() {
  if (!imageExists()) {
    pullImage();
  } else {
    console.log(`Image ${POSTGRES_IMAGE} already exists.`);
  }

  if (containerExists()) {
    if (containerIsRunning()) {
      console.log(`Container ${CONTAINER_NAME} is already running.`);
    } else {
      startContainer();
      console.log(`Container ${CONTAINER_NAME} started.`);
    }
  } else {
    createContainer();
    console.log(`Container ${CONTAINER_NAME} created and started.`);
  }

  waitForPostgres();
  console.log("\nPostgres is ready!");
  console.log(`Connection info:`);
  console.log(`  Host: localhost`);
  console.log(`  Port: ${PORT}`);
  console.log(`  User: ${POSTGRES_USER}`);
  console.log(`  Password: ${POSTGRES_PASSWORD}`);
  console.log(`  Database: ${POSTGRES_DB}`);
  console.log(`\nTo connect: psql -h localhost -p ${PORT} -U ${POSTGRES_USER} ${POSTGRES_DB}`);
  //updateEnvFile();
}

main();

// THe PG config in docker image is so basic I think it can just be anticipated

// function updateEnvFile() {
//   const DB_URL = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${PORT}/${POSTGRES_DB}`;
//   const envPath = path.resolve(process.cwd(), ".env.e2e");
//   let lines = [];
//   if (fs.existsSync(envPath)) {
//     lines = fs.readFileSync(envPath, "utf-8").split("\n");
//   }
//   let found = false;
//   lines = lines.map((line) => {
//     if (line.startsWith("DB_URL=")) {
//       found = true;
//       return `DB_URL=${DB_URL}`;
//     }
//     return line;
//   });
//   if (!found) lines.unshift(`DB_URL=${DB_URL}`);
//   fs.writeFileSync(envPath, lines.join("\n"), "utf-8");
//   console.log(`Updated .env.e2e with DB_URL=${DB_URL}`);
// }

