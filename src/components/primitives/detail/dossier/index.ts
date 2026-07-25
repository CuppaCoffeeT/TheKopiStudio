/**
 * Dossier — the 2a detail-archetype body vocabulary.
 *
 * `PageShell` lays the two columns out (1.4fr / 1fr, 22px gaps); these are the
 * cream panels that fill them. Composition in the comp:
 *   wide column  → DossierPanel(stat) [ DossierStatGrid + DossierRampBar ]
 *                  DossierPanel(prose) [ notes ]
 *   narrow column → DossierPanel(list) [ DossierKeyValueList ]
 *                  DossierLoadingPanel [ transient states ]
 */

export { DossierPanel, DossierPanelLabel, type DossierPanelDensity } from './DossierPanel';
export { DossierStatGrid, type DossierStat } from './DossierStatGrid';
export { DossierRampBar, type DossierRampSegment } from './DossierRampBar';
export { DossierKeyValueList, type DossierKeyValue } from './DossierKeyValueList';
export { DossierLoadingPanel } from './DossierLoadingPanel';
