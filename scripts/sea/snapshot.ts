// Startup snapshot entry: the bundle runs once at build time, the CLI runs on
// deserialize. Opt-in via `node scripts/sea/build.mjs --mode snapshot`.
import { startupSnapshot } from 'node:v8';
import { run } from './run.ts';

startupSnapshot.setDeserializeMainFunction(() => {
	run();
});
