/**
 * Report section [12] — client interaction history table (legacy
 * ClientReportModal.jsx:520-546, git c09c549).
 *
 * Date-DESC rows as delivered by listInteractionsByClient (the service orders
 * date / created_at / id DESC — no re-sort here). ALWAYS renders; an empty
 * timeline shows the legacy "No interactions recorded yet." line. No money
 * math — dates via timezoneUtils, follow-up '' → "None" like legacy.
 * Print-first light-locked per the report-print.css contract.
 */

import { formatDisplayDateLong } from '@/utils/timezoneUtils';
import type { CrmInteraction } from '../../types';

export function ReportInteractionHistory({ interactions }: { interactions: CrmInteraction[] }) {
  return (
    <section className="report-section" data-testid="report-interaction-history">
      <h2>Client interaction history</h2>
      {interactions.length === 0 ? (
        <p className="text-[12px] text-gray-500">No interactions recorded yet.</p>
      ) : (
        <table className="report-table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Type</th>
              <th scope="col">Notes</th>
              <th scope="col">Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {interactions.map((interaction) => (
              <tr key={interaction.id} data-testid={`report-interaction-row-${interaction.id}`}>
                <td>{formatDisplayDateLong(interaction.date)}</td>
                <td>{interaction.type}</td>
                <td>{interaction.notes}</td>
                <td>{interaction.followUp ? formatDisplayDateLong(interaction.followUp) : 'None'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
