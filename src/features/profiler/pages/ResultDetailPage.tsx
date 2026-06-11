import { useParams } from 'react-router-dom';
import { DetailPageFrame } from '@/components/primitives/detail/DetailPageFrame';
import { Card, CardContent } from '@/components/primitives/shell/Card';
import { NoResultsState } from '@/components/primitives/shell/NoResultsState';

/**
 * ResultDetailPage — full report for one saved profiling result (DETAIL archetype).
 *
 * Shares modulePath '/profiler-results' with the list route.
 *
 * P1 scaffold stub: renders the real DetailPageFrame with an honest empty
 * body. Report reconstruction (hero, DISC bars, MBTI strengths recomputed via
 * the scoring replay, notes, delete, exports) lands in Phase P4.
 */
export default function ResultDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <DetailPageFrame
      breadcrumb={[
        { label: 'Workspace', href: '/dashboard' },
        { label: 'Results', href: '/profiler-results' },
        { label: id ?? 'Result' },
      ]}
      title="Profiling result"
      recordId={id ? id.slice(0, 8) : undefined}
      status={{ tone: 'neutral', label: 'IN BUILD' }}
      variant="fullWidth"
      testId="profiler-result-detail"
    >
      <Card>
        <CardContent>
          <NoResultsState />
        </CardContent>
      </Card>
    </DetailPageFrame>
  );
}
