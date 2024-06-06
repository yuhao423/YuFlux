// @ts-check
const { readFileSync } = require("fs");
const path = require("path");
const colors = require("colors");

const msgPath = path.resolve(".git/COMMIT_EDITMSG");
// const msgPath = process.env.GIT_PARAMS;
// @ts-ignore
const msg = readFileSync(msgPath, "utf-8").trim();

const commitRE =
  /^(revert: )?(feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip|release)(\(.+\))?: .{1,100}/;
console.log(commitRE.test(msg), msg, "msg");
if (!commitRE.test(msg)) {
  console.log();
  console.error(
    `  ${colors.bgRed.white(" ERROR ")} ${colors.red(
      "invalid commit message format.",
    )}\n\n${colors.red(
      "  Proper commit message format is required for automated changelog generation. Examples:\n\n",
    )}    ${colors.green("feat(compiler): add 'comments' option")}\n` +
      `    ${colors.green("fix(v-model): handle events on blur (close #28)")}\n\n${colors.red(
        "  ont of commit must start with feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip|release.\n",
      )}`,
  );
  process.exit(1);
}
