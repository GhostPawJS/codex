import { PageCapture } from './page_capture.tsx';
import { PageDashboard } from './page_dashboard.tsx';
import { PageDetail } from './page_detail.tsx';
import { PageFlags } from './page_flags.tsx';
import { PageLog } from './page_log.tsx';
import { parseDetailId, useCurrentRoute } from './router.ts';

export function PageRouter() {
	const route = useCurrentRoute();

	const detailId = parseDetailId(route);
	if (detailId !== null) return <PageDetail beliefId={detailId} />;

	switch (route) {
		case 'capture':
			return <PageCapture />;
		case 'flags':
			return <PageFlags />;
		case 'log':
			return <PageLog />;
		default:
			return <PageDashboard />;
	}
}
