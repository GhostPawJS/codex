import { useMemo } from 'preact/hooks';
import * as read from '../read.ts';
import * as write from '../write.ts';
import { useCodex } from './context.ts';
import { percent } from './format.ts';
import { BeliefActions, BeliefCard, EmptyState, Panel } from './ui/index.ts';

export function PageFlags() {
	const { db, revision, mutate, toast } = useCodex();
	const flags = useMemo(() => read.listFlags(db), [db, revision]);
	const status = useMemo(() => read.getStatus(db), [db, revision]);

	const handleConfirm = (id: number) => {
		mutate(() => {
			write.confirmBelief(db, id);
			toast('Confirmed.');
		});
	};

	const handleCorrect = (id: number, newClaim: string) => {
		mutate(() => {
			write.correctBelief(db, id, { claim: newClaim });
			toast('Corrected. Old belief superseded.');
		});
	};

	const handleForget = (id: number) => {
		mutate(() => {
			write.forgetBelief(db, id);
			toast('Forgotten.');
		});
	};

	const handleDefer = (id: number, until: number) => {
		mutate(() => {
			write.deferBelief(db, id, until);
			toast('Deferred.');
		});
	};

	return (
		<div class="page">
			<h1 class="page-title">
				Flags {flags.length > 0 && <span class="title-badge">{flags.length}</span>}
			</h1>

			{flags.length === 0 ? (
				<Panel>
					<EmptyState
						glyph="✓"
						title="No flags. Your Codex is healthy."
						subtitle={`Integrity: ${percent(status.integrity)}`}
					/>
				</Panel>
			) : (
				<div class="flags-list">
					{flags.map((flag) => (
						<BeliefCard key={flag.id} belief={flag} reasonCodes={flag.reasonCodes}>
							<BeliefActions
								onConfirm={() => handleConfirm(flag.id)}
								onCorrect={(newClaim) => handleCorrect(flag.id, newClaim)}
								onForget={() => handleForget(flag.id)}
								onDefer={(until) => handleDefer(flag.id, until)}
								oldClaim={flag.claim}
							/>
						</BeliefCard>
					))}
				</div>
			)}
		</div>
	);
}
