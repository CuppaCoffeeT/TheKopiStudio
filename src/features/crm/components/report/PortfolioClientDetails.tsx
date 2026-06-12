/**
 * Portfolio report — per-client detail blocks (legacy Reports.jsx:91-160,
 * "Client details": facts table + per-client policy table).
 *
 * Pure presentation: raw row values arrive via `portfolioService`; the only
 * inline work is the legacy display formatting (`toLocaleString` wrappers —
 * legacy showed `parseInt(v || 0).toLocaleString()` for income/coverage and
 * the RAW `premium/frequency` pair with no math). Each client block keeps
 * the legacy `pageBreakInside: 'avoid'`. Print-first light-locked styling
 * per the lib/report-print.css contract.
 */

import type { PortfolioReportClient } from '../../api/portfolioService';

const avoidBreak = { breakInside: 'avoid', pageBreakInside: 'avoid' } as const;

function ClientBlock({ client }: { client: PortfolioReportClient }) {
  const facts = [
    { id: 'contact', label: 'Contact', value: `${client.email} · ${client.phone}` },
    { id: 'occupation', label: 'Occupation', value: client.occupation },
    {
      id: 'income',
      label: 'Annual income',
      value: `$${Math.round(client.annualIncome).toLocaleString()}`,
    },
    { id: 'risk', label: 'Risk profile', value: client.riskProfile },
  ];

  return (
    <div
      className="mb-6"
      style={avoidBreak}
      data-testid={`report-portfolio-client-${client.id}`}
    >
      <h3>{client.name}</h3>
      <table className="report-table">
        <tbody>
          {facts.map((fact) => (
            <tr key={fact.id}>
              <th scope="row" className="w-[200px]">
                {fact.label}
              </th>
              <td>{fact.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {client.policies.length > 0 && (
        // Horizontally scrollable on narrow viewports — keyboard users need a
        // tab stop to scroll it (axe wcag2aa `scrollable-region-focusable`).
        <div
          className="mt-3 overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label={`${client.name} policies`}
        >
          <h4 className="mb-1 text-[13px] font-semibold">Policies</h4>
          <table className="report-table" data-testid={`report-portfolio-policies-${client.id}`}>
            <thead>
              <tr>
                <th scope="col">Type</th>
                <th scope="col">Provider</th>
                <th scope="col">Policy #</th>
                <th scope="col" className="num">
                  Premium
                </th>
                <th scope="col" className="num">
                  Coverage
                </th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {client.policies.map((policy) => (
                <tr key={policy.id}>
                  <td>{policy.type}</td>
                  <td>{policy.provider}</td>
                  <td>{policy.policyNumber}</td>
                  <td className="num">
                    ${policy.premium.toLocaleString()}/{policy.frequency}
                  </td>
                  <td className="num">${Math.round(policy.coverageAmount).toLocaleString()}</td>
                  <td>{policy.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function PortfolioClientDetails({ clients }: { clients: PortfolioReportClient[] }) {
  return (
    <section
      className="report-section report-page-break"
      data-testid="report-portfolio-clients"
    >
      <h2>Client details</h2>
      {clients.map((client) => (
        <ClientBlock key={client.id} client={client} />
      ))}
    </section>
  );
}
