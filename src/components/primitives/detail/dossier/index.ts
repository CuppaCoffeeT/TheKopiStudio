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

export { DossierPanel,   } from './DossierPanel';
export { DossierStatGrid,  } from './DossierStatGrid';
export { DossierRampBar,  } from './DossierRampBar';
export { DossierKeyValueList,  } from './DossierKeyValueList';
export { DossierLoadingPanel } from './DossierLoadingPanel';
