const { execSync } = require("child_process");

const CONTAINER_NAME = "e2e-test-postgres";

try {
  execSync(`docker rm -f ${CONTAINER_NAME}`, { stdio: "inherit" });
  console.log(`Stopped and removed container: ${CONTAINER_NAME}`);
} catch (e) {
  console.log(`Container ${CONTAINER_NAME} was already stopped/removed or does not exist.`);
}
