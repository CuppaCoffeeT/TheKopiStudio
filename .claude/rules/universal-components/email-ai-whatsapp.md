# Universal Components — Email · AI · WhatsApp surfaces

Niche-surface "Need → Import" rows split out from [universal-components.md](../universal-components.md) so the parent stays under the rule-doc ceiling. Same enforcement: every cell is a hard "use-this-not-that" rule for new code.

## Email surfaces

| Need | ✅ Import | ❌ Don't import |
|---|---|---|
| Gmail-style sidebar (account + labels + AI-category chips + sync) | `EmailSidebar` from `@/components/primitives/shell` | hand-rolled aside + raw `Select` + native lucide button rows |
| AI classification category badge (12 tone pairs · static OR filter toggle) | `EmailCategoryBadge` from `@/components/primitives/shell` | inline Tailwind `bg-*-100 text-*-800` chip · the deleted `components/email/EmailClassificationBadge` |
| Downloadable file attachment chip (filename + size + download icon · idle/loading/error) | `AttachmentChip` from `@/components/primitives/shell` | raw `<Button>` with inline paperclip + filename text |
| Cross-entity "Linked to X" colored-dot pill | `LinkedEntityPill` from `@/components/primitives/shell` | ad-hoc `<span>` with inline rounded-full + dot div |
| User-authored HTML body (email body · notification archive · internal memo) | `SanitizedHtmlProse` from `@/components/primitives/shell` — DOMPurify + CID resolution + image-policy banner + prose tokens | inline `dangerouslySetInnerHTML` + DOMPurify · Tailwind Typography `prose` plugin |
| Inbox thread list row (star · read-state · subject · count · snippet · category · date · unread/selected accents) | `EmailThreadRow` from `@/components/primitives/ui` | hand-rolled grid row + inline star button |
| Thread detail compact header (back · title · count · linked entities · star) | `EmailDetailHeader` from `@/components/primitives/detail` | hand-composed glass bar + manual back-chevron button |
| Expandable message card (From/To/CC/BCC · HTML body · attachments · reply actions) | `EmailMessageCard` from `@/components/primitives/detail` | hand-rolled `<Card>` + inline ChevronUp/Down toggle |
| Gmail-style compose form (from · to · cc/bcc toggle · subject · body) | `EmailComposeForm` from `@/components/primitives/form` — stateless; caller wraps with Modal/Drawer | hand-rolled form in a Dialog · ad-hoc state management |

## AI / agent surfaces

| Need | ✅ Import | ❌ Don't import |
|---|---|---|
| Agent inbox compact trigger chip | `InboxChip` from `@/components/primitives/shell` | raw button with inbox icon + count pill |
| Agent situation bar (info sentence + inbox chip, scroll-aware floating clone) | `SituationBar` from `@/components/primitives/shell` | rolling your own status strip + separate chip + scroll listener |
| Agent expanded rail panel shell (title + collapse-header + empty state + children slot) | `InboxRailPanel` from `@/components/primitives/shell` | hand-rolled aside with chevron button |
| AI-annotation card shell on a detail page (green/blue/amber accent · icon + title + status pill + body + actions + footer) | `AIPanel` from `@/components/primitives/detail` (with `AIPanelStatusPill` + `AIPanelActionButton`) | hand-rolled `<Card>` with colored left strip + ad-hoc buttons |
| AI classification surface (category badge + confidence + reasoning + Correct/Wrong/Notes) | `AIClassificationPanel` from `@/components/primitives/detail` | composing AIPanel inline each time |
| AI classification override (AI-vs-Manual grid + reason + history trail) | `AIOverrideClassificationPanel` from `@/components/primitives/detail` | composing AIPanel + bespoke grid inline |
| AI draft reply review (approve · edit inline · decline-with-reason) | `AIDraftReplyPanel` from `@/components/primitives/detail` | composing AIPanel + ad-hoc mode state machine |
| From→to audit log / override history list | `HistoryTrailList` from `@/components/primitives/detail` | hand-rolled ordered list + inline arrow spans |

## WhatsApp surface

| Need | ✅ Import | ❌ Don't import |
|---|---|---|
| WhatsApp thread surface (header + count + HITL toggle + bubble scroller + composer · `surface=card\|bare` · `compact`) | `WhatsAppThreadPanel` from `@/components/primitives/detail` — pure presentation; caller wires `messages` query + realtime subscription + send/HITL mutations | hand-composing `WhatsAppConversation` + `WhatsAppSendBox` from `@/components/comms/*` (now superseded). Trips W09 grep #6b inside any feature folder. |

## 📚 Related

- [universal-components.md](../universal-components.md) — parent rule (generic Need→Import table + auto-load `paths:`)
- [universal-components-protocols.md](../universal-components-protocols.md) — sanctioned `ui/**` exceptions · edit/create protocols
- [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) — full inventory
