// Prints the version of the commit being built, as "<version> <versionCode>", e.g. "1.2.3 48".
//   version     = <major.minor from app.json>.<commits on main since major.minor was last changed>
//                 Only main's own commits count (--first-parent): a merged batch counts once,
//                 whatever its number of commits. Setting 1.2.0 in app.json gives 1.2.0, then
//                 1.2.1 at the next merge, and so on.
//   versionCode = total number of commits: it never goes down, so every APK installs over the
//                 previous one (Android only compares this number).
// Needs the full git history (CI: actions/checkout with fetch-depth: 0).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const majorMinor = (json) => JSON.parse(json).expo.version.split('.').slice(0, 2).join('.');

// The working copy counts, so a local build right after editing app.json already uses it.
const current = majorMinor(readFileSync('app.json', 'utf8'));

// Walk main's own history back from HEAD while major.minor stays the same.
let sameVersion = 0;
for (const commit of git('log', '--first-parent', '--format=%H', 'HEAD').split('\n')) {
  let version;
  try {
    version = majorMinor(git('show', `${commit}:app.json`));
  } catch {
    break;
  }
  if (version !== current) break;
  sameVersion++;
}

// The oldest of those commits introduced the version: it is x.y.0. None at all means app.json
// was just edited and not committed yet: this build is the first of the new version too.
const patch = Math.max(0, sameVersion - 1);
const versionCode = Number(git('rev-list', '--count', 'HEAD'));
console.log(`${current}.${patch} ${versionCode}`);
